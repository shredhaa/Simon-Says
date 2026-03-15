let bodySegmentation;
let video;
let segmentation;
let handPose;
let hands = [];
let path = [];
let spacing = 10;
let paragraph = "A fairy godmother transformed pumpkins and mice into a shining carriage.";
let options = { maskType: "background" };
// Smoothing
let smoothX, smoothY;
const SMOOTHEN = 0.07;


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
}
function draw() {
  background(255, 102, 0);

  if (hands.length > 0) {
    let hand = hands[0];
    let index = hand.keypoints[8];
    // Smooth finger position with lerp
    if (smoothX === undefined) {
      smoothX = index.x;
      smoothY = index.y;
    } else {
      smoothX = lerp(smoothX, index.x, SMOOTHEN);
      smoothY = lerp(smoothY, index.y, SMOOTHEN);
    }
    // Finger dot
    fill(255, 0, 255);
    noStroke();
    circle(smoothX, smoothY, 16);
    addPathPoint(smoothX, smoothY);
    drawParagraphOnPath();
  }
  if (segmentation) {
    push();
    tint(255, 120);
    image(segmentation.mask,0, 0, width, height);
    pop();
  }
}
function addPathPoint(x, y) {
  if (
    path.length === 0 ||
    dist(x, y, path[path.length - 1].x, path[path.length - 1].y) > spacing
  ) {
    path.push({ x, y });
    if (path.length > 500) {
      path.shift();
    }
  }
}
function drawParagraphOnPath() {
  if (path.length < 2) return;
  // Build cumulative distance array
  let cumDist = [0];
  for (let i = 1; i < path.length; i++) {
    let d = dist(path[i].x, path[i].y, path[i - 1].x, path[i - 1].y);
    cumDist.push(cumDist[i - 1] + d);
  }
  let totalLen = cumDist[cumDist.length - 1];
  textFont('Palatino');        // 👈 add this
  textSize(20);
  textAlign(CENTER, CENTER);
  let charSpacing = 12;  // px between characters
  let numChars = floor(totalLen / charSpacing);
  for (let i = 0; i < numChars; i++) {
    let targetDist = i * charSpacing;
    if (targetDist > totalLen) break;
    // Binary search for segment
    let seg = findSegment(cumDist, targetDist);
    if (seg >= path.length - 1) break;
    // Interpolate position within segment
    let segLen = cumDist[seg + 1] - cumDist[seg];
    let t = segLen === 0 ? 0 : (targetDist - cumDist[seg]) / segLen;
    let x = lerp(path[seg].x, path[seg + 1].x, t);
    let y = lerp(path[seg].y, path[seg + 1].y, t);
    // Angle from segment direction
    let angle = atan2(
      path[seg + 1].y - path[seg].y,
      path[seg + 1].x - path[seg].x
    );
    // Fade older characters
    let fade = map(i, 0, numChars, 60, 255);
    let char = paragraph[i % paragraph.length];
    push();
    translate(x, y);
    rotate(angle);
    fill(0, fade);
    noStroke();
    text(char, 0, 0);
    pop();
  }
}
// Find the path segment index for a given cumulative distance
function findSegment(cumDist, target) {
  let lo = 0, hi = cumDist.length - 2;
  while (lo < hi) {
    let mid = floor((lo + hi + 1) / 2);
    if (cumDist[mid] <= target) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
function gotResults(result) {
  segmentation = result;
}
function gotHands(results) {
  hands = results;
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
