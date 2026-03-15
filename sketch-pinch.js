let bodySegmentation;
let video;
let segmentation;
let handPose;
let hands = [];

let paragraph = "But when the work was finished, she walked outside to a small tree growing beside her mother’s grave. There she whispered her wishes into the branches and waited as the wind moved through the leaves. Sometimes a bird would drop a gift into her hands, as if the world itself had heard her sorrow.";

let smoothPinch = 40;
const PINCH_SMOOTH = 0.09;
const PINCH_CLOSED = 40;
const PINCH_OPEN = 160;

// Text position follows midpoint of pinch
let textX, textY;
let smoothTextX, smoothTextY;
const POS_SMOOTH = 0.1;

function preload() {
  bodySegmentation = ml5.bodySegmentation("BodyPix", { flipped: true });
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO, { flipped: true });
  video.size(windowWidth, windowHeight);
  video.hide();
  bodySegmentation.detectStart(video, gotResults);
  handPose.detectStart(video, gotHands);

  // Start centred
  smoothTextX = width / 2;
  smoothTextY = height / 2;
}

function draw() {
  background(224, 82, 255);
  
  if (segmentation) {
    push();
    tint(255, 120);
    image(segmentation.mask, 0,0, width, height);
    pop();
  }
  if (hands.length > 0) {
    let hand = hands[0];
    let thumb = hand.keypoints[4];
    let index = hand.keypoints[8];

    // Scale from pinch distance
    let rawPinch = dist(thumb.x, thumb.y, index.x, index.y);
    smoothPinch = lerp(smoothPinch, rawPinch, PINCH_SMOOTH);

    // 👇 Position from index fingertip, not midpoint
    smoothTextX = lerp(smoothTextX, index.x, POS_SMOOTH);
    smoothTextY = lerp(smoothTextY, index.y, POS_SMOOTH);

    // Pinch indicator
    stroke(0, 80);
    strokeWeight(1);
    line(thumb.x, thumb.y, index.x, index.y);
    fill(255, 0, 200);
    noStroke();
    circle(thumb.x, thumb.y, 10);
    circle(index.x, index.y, 10);
  }

  let fontSize = constrain(map(smoothPinch, PINCH_CLOSED, PINCH_OPEN, 12, 80), 12, 80);
  drawScaledText(fontSize);
}

function drawScaledText(fontSize) {
  let scaleFactor = fontSize / 17;
  let boxW = width * 0.7;

  push();
  translate(smoothTextX, smoothTextY); // top-left is now exactly at finger
  scale(scaleFactor);
  fill(0);
  noStroke();
  textFont('Palatino');
  textSize(17);
  textLeading(17 * 1.4);
  textAlign(LEFT, BASELINE); // 👈 anchor is top-left
  text(paragraph, 0, 0, boxW/2, height);
  pop();
}

function gotResults(result) {
  segmentation = result;
}

function gotHands(results) {
  hands = results;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
}
