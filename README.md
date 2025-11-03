# Scissors Detected

## About this app

Scissors Detected is a React webapp that uses Tensorflow and YOLO to detect people and scissors in the webcam feed. When scissors are detected, a photo is captured as potential evidence for running with scissors. 
Once the webcam feed is active, participants can hold up a pair of scissors to be captured by the feed.

## Quickstart

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Bud for production
npm run build
```

## Troubleshooting
- Refresh page to restart webcam feed
- Confirm that camera permissions are granted
- Make sure area is well-lit

## References

- [Building a Webcam App with ReactJS](https://medium.com/@gk150899/building-a-webcam-app-with-reactjs-3111c1e90efb)
- [YOLOv8 Object Detection on Browser](https://github.com/akbartus/Yolov8-Object-Detection-on-Browser/blob/main/index.html)