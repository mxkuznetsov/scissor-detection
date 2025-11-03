import { useState, useCallback, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

// Object detection interface
export interface ObjectDetection {
    bbox: [number, number, number, number]; // [x, y, width, height]
    confidence: number;
    timestamp: Date;
    className: string; // 'person' or 'scissors'
    classIndex: number;
}

// YOLO class indices for detection (COCO dataset)
const PERSON_CLASS_INDEX = 0;
const SCISSORS_CLASS_INDEX = 76;

// Class names mapping
const CLASS_NAMES: Record<number, string> = {
    [PERSON_CLASS_INDEX]: 'person',
    [SCISSORS_CLASS_INDEX]: 'scissors'
};

// Classes to detect
const DETECTION_CLASSES = [PERSON_CLASS_INDEX, SCISSORS_CLASS_INDEX];

// YOLOv8 model configuration
const YOLO_CONFIG = {
    modelUrl: 'https://raw.githubusercontent.com/akbartus/Yolov8-Object-Detection-on-Browser/main/tfjs_version/yolov8x_web_model/model.json',
    inputSize: 640,
    confidenceThreshold: 0.5,
    iouThreshold: 0.4
};

export const usePersonDetection = () => {
    const [detectedPersons, setDetectedPersons] = useState<ObjectDetection[]>([]);
    const [isDetecting, setIsDetecting] = useState<boolean>(false);
    const [modelLoaded, setModelLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const modelRef = useRef<tf.GraphModel | null>(null);

    // Initialize TensorFlow.js and load the model
    const initializeModel = useCallback(async (): Promise<void> => {
        try {
            console.log('🧠 Initializing TensorFlow.js...');

            // Set backend to WebGL for better performance
            await tf.setBackend('webgl');
            await tf.ready();

            console.log('📥 Loading YOLOv8 model from:', YOLO_CONFIG.modelUrl);
            setError(null);

            // Load the YOLOv8 model
            const model = await tf.loadGraphModel(YOLO_CONFIG.modelUrl);
            modelRef.current = model;
            setModelLoaded(true);

            // Warm up the model with a dummy input
            console.log('🔥 Warming up model...');
            const dummyInput = tf.zeros([1, YOLO_CONFIG.inputSize, YOLO_CONFIG.inputSize, 3]);
            await model.predict(dummyInput);
            dummyInput.dispose();

            console.log('✅ YOLOv8 model loaded and ready for person detection!');
        } catch (err) {
            console.error('❌ Error loading model:', err);
            setError(`Failed to load YOLOv8 model: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setModelLoaded(false);
        }
    }, []);

    // Preprocess video frame for YOLOv8
    const preprocessImage = useCallback((videoElement: HTMLVideoElement): tf.Tensor => {
        return tf.tidy(() => {
            // Convert video to tensor
            const videoTensor = tf.browser.fromPixels(videoElement);

            // Resize to model input size (640x640)
            const resized = tf.image.resizeBilinear(videoTensor, [YOLO_CONFIG.inputSize, YOLO_CONFIG.inputSize]);

            // Normalize to [0, 1] and convert to float32
            const normalized = resized.div(255.0).cast('float32');

            // Add batch dimension [1, 640, 640, 3]
            const batched = normalized.expandDims(0);

            return batched;
        });
    }, []);

    // Calculate Intersection over Union (IoU)
    const calculateIoU = useCallback((box1: number[], box2: number[]): number => {
        const [x1_1, y1_1, x2_1, y2_1] = box1;
        const [x1_2, y1_2, x2_2, y2_2] = box2;

        const intersectionX1 = Math.max(x1_1, x1_2);
        const intersectionY1 = Math.max(y1_1, y1_2);
        const intersectionX2 = Math.min(x2_1, x2_2);
        const intersectionY2 = Math.min(y2_1, y2_2);

        if (intersectionX2 <= intersectionX1 || intersectionY2 <= intersectionY1) {
            return 0;
        }

        const intersectionArea = (intersectionX2 - intersectionX1) * (intersectionY2 - intersectionY1);
        const box1Area = (x2_1 - x1_1) * (y2_1 - y1_1);
        const box2Area = (x2_2 - x1_2) * (y2_2 - y1_2);
        const unionArea = box1Area + box2Area - intersectionArea;

        return intersectionArea / unionArea;
    }, []);

    // Non-Maximum Suppression to filter overlapping boxes
    const nonMaxSuppression = useCallback((
        boxes: number[][],
        scores: number[],
        confidenceThreshold: number,
        iouThreshold: number
    ): number[] => {
        const validDetections = boxes
            .map((box, index) => ({ box, score: scores[index], index }))
            .filter(detection => detection.score >= confidenceThreshold)
            .sort((a, b) => b.score - a.score);

        const selectedIndices: number[] = [];
        const suppressedIndices = new Set<number>();

        for (const detection of validDetections) {
            if (suppressedIndices.has(detection.index)) continue;

            selectedIndices.push(detection.index);

            for (const otherDetection of validDetections) {
                if (otherDetection.index === detection.index || suppressedIndices.has(otherDetection.index)) continue;

                const iou = calculateIoU(detection.box, otherDetection.box);
                if (iou > iouThreshold) {
                    suppressedIndices.add(otherDetection.index);
                }
            }
        }

        return selectedIndices;
    }, [calculateIoU]);

    // Process model output and extract object detections
    const processDetections = useCallback((
        output: tf.Tensor,
        videoWidth: number,
        videoHeight: number
    ): ObjectDetection[] => {
        // YOLOv8 output format: [1, 84, 8400] where 84 = [x, y, w, h] + 80 class scores
        const predictions = output.squeeze(); // Remove batch dimension: [84, 8400]
        const transposed = predictions.transpose([1, 0]); // [8400, 84]

        const data = transposed.dataSync();
        const numDetections = transposed.shape[0];

        const detections: { box: number[], score: number, classIndex: number, className: string }[] = [];

        for (let i = 0; i < numDetections; i++) {
            const offset = i * 84;

            // Check each detection class we're interested in
            for (const classIndex of DETECTION_CLASSES) {
                const classConfidence = data[offset + 4 + classIndex];

                if (classConfidence >= YOLO_CONFIG.confidenceThreshold) {
                    // Extract bounding box (center format)
                    const centerX = data[offset + 0];
                    const centerY = data[offset + 1];
                    const width = data[offset + 2];
                    const height = data[offset + 3];

                    // Convert to corner format and scale to video dimensions
                    const x1 = (centerX - width / 2) * (videoWidth / YOLO_CONFIG.inputSize);
                    const y1 = (centerY - height / 2) * (videoHeight / YOLO_CONFIG.inputSize);
                    const x2 = (centerX + width / 2) * (videoWidth / YOLO_CONFIG.inputSize);
                    const y2 = (centerY + height / 2) * (videoHeight / YOLO_CONFIG.inputSize);

                    detections.push({
                        box: [x1, y1, x2, y2],
                        score: classConfidence,
                        classIndex,
                        className: CLASS_NAMES[classIndex]
                    });
                }
            }
        }

        // Clean up tensors
        predictions.dispose();
        transposed.dispose();

        // Group detections by class for separate NMS
        const detectionsByClass = new Map<number, typeof detections>();
        for (const detection of detections) {
            if (!detectionsByClass.has(detection.classIndex)) {
                detectionsByClass.set(detection.classIndex, []);
            }
            detectionsByClass.get(detection.classIndex)!.push(detection);
        }

        // Apply NMS per class and combine results
        const finalDetections: ObjectDetection[] = [];
        for (const [, classDetections] of Array.from(detectionsByClass.entries())) {
            const boxes = classDetections.map((d: any) => d.box);
            const scores = classDetections.map((d: any) => d.score);

            const selectedIndices = nonMaxSuppression(
                boxes,
                scores,
                YOLO_CONFIG.confidenceThreshold,
                YOLO_CONFIG.iouThreshold
            );

            // Convert selected detections to ObjectDetection format
            const classResults = selectedIndices.map(index => {
                const detection = classDetections[index];
                const [x1, y1, x2, y2] = detection.box;
                return {
                    bbox: [x1, y1, x2 - x1, y2 - y1] as [number, number, number, number],
                    confidence: detection.score,
                    timestamp: new Date(),
                    className: detection.className,
                    classIndex: detection.classIndex
                };
            });

            finalDetections.push(...classResults);
        }

        return finalDetections;
    }, [nonMaxSuppression]);

    // Main detection function
    const detectPersons = useCallback(async (videoElement: HTMLVideoElement): Promise<void> => {
        if (!modelRef.current || !modelLoaded) {
            console.warn('⚠️ Model not loaded yet');
            return;
        }

        try {
            setIsDetecting(true);
            setError(null);

            // Preprocess the video frame
            const inputTensor = preprocessImage(videoElement);

            // Run inference
            const output = await modelRef.current.predict(inputTensor) as tf.Tensor;

            // Process detections
            const persons = processDetections(output, videoElement.videoWidth, videoElement.videoHeight);

            // Update state with new detections
            setDetectedPersons(persons);

            if (persons.length > 0) {
                console.log(`👤 Detected ${persons.length} person(s)`);
            }

            // Clean up tensors
            inputTensor.dispose();
            output.dispose();

        } catch (err) {
            console.error('❌ Error during person detection:', err);
            setError(`Detection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsDetecting(false);
        }
    }, [modelLoaded, preprocessImage, processDetections]);

    // Cleanup function
    const cleanup = useCallback((): void => {
        if (modelRef.current) {
            modelRef.current.dispose();
            modelRef.current = null;
        }
        setModelLoaded(false);
        setDetectedPersons([]);
        console.log('🧹 YOLOv8 model cleaned up');
    }, []);

    // Initialize model on mount
    useEffect(() => {
        initializeModel();
        return cleanup;
    }, [initializeModel, cleanup]);

    return {
        detectedPersons,
        isDetecting,
        modelLoaded,
        error,
        detectPersons,
        initializeModel,
        cleanup
    };
};