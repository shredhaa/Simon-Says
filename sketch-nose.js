let bodySegmentation;
let video;
let segmentation;
let faceMesh;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipped: true };

let paragraph = "The prince searched far and wide for the one whose step matched the lost shoe. When he found her, she did not bow her head this time. She stood upright, calm and certain. In some stories she had waited patiently. In others she had trusted the justice of nature. In another she had acted with kindness and spiritual balance. And in yet another she had simply dared to dream. Yet in every telling, the small gesture of a step forward changed her fate.";

let words = [];
let boxX, boxY, boxW, boxH;

let smoothNoseX, smoothNoseY;
const NOSE_SMOOTH = 0.12;
const REPEL_RADIUS = 70;
const REPEL_FORCE = 100;
const RETURN_SPEED = 0.04;

function preload() {
  bodySegmentation = ml5.bodySegmentation("BodyPix", { flipped: true });
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO, { flipped: true });
  video.size(windowWidth, windowHeight);
  video.hide();
  bodySegmentation.detectStart(video, gotResults);
  faceMesh.detectStart(video, gotFaces);
  setupBox();
  initWords();
}

function setupBox() {
  boxX = width * 0.13;
  boxY = height * 0.12;
  boxW = width * 0.74;
  boxH = height * 0.75;
}

function initWords() {
  words = [];
  textFont('Palatino');
  textSize(20);

  let wordList = paragraph.split(" ");
  let lineH = 28;
  let padding = 20;
  let maxLineW = boxW - padding * 2;

  let lines = [];
  let currentLine = [];
  let currentLineW = 0;

  for (let i = 0; i < wordList.length; i++) {
    let ww = textWidth(wordList[i] + " ");
    if (currentLineW + ww > maxLineW && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [{ word: wordList[i], w: ww }];
      currentLineW = ww;
    } else {
      currentLine.push({ word: wordList[i], w: ww });
      currentLineW += ww;
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);

  let totalH = lines.length * lineH;
  let startY = boxY + (boxH - totalH) / 2;

  for (let li = 0; li < lines.length; li++) {
    let line = lines[li];
    let lineW = line.reduce((sum, w) => sum + w.w, 0);
    let startX = boxX + padding + (maxLineW - lineW) / 2;
    let xCursor = startX;

    for (let wi = 0; wi < line.length; wi++) {
      let hx = xCursor;
      let hy = startY + li * lineH;
      words.push({
        word: line[wi].word,
        x: hx, y: hy,
        homeX: hx, homeY: hy,
        vx: 0, vy: 0
      });
      xCursor += line[wi].w;
    }
  }
}

function draw() {
  background(0, 200, 0);

  if (segmentation) {
    push();
    tint(255, 120);
    image(segmentation.mask, 0, 0, width, height);
    pop();
  }

  // Smooth nose
  if (faces.length > 0) {
    let nose = faces[0].keypoints[1];
    if (nose) {
      if (smoothNoseX === undefined) {
        smoothNoseX = nose.x;
        smoothNoseY = nose.y;
      } else {
        smoothNoseX = lerp(smoothNoseX, nose.x, NOSE_SMOOTH);
        smoothNoseY = lerp(smoothNoseY, nose.y, NOSE_SMOOTH);
      }
    }
  }

  // Update + draw words
  for (let w of words) {
    w.vx += (w.homeX - w.x) * RETURN_SPEED;
    w.vy += (w.homeY - w.y) * RETURN_SPEED;

    if (smoothNoseX !== undefined) {
      let dx = w.x - smoothNoseX;
      let dy = w.y - smoothNoseY;
      let d = sqrt(dx * dx + dy * dy);
      if (d < REPEL_RADIUS && d > 0) {
        let force = (1 - d / REPEL_RADIUS) * REPEL_FORCE;
        w.vx += (dx / d) * force;
        w.vy += (dy / d) * force;
      }
    }

    w.vx *= 0.78;
    w.vy *= 0.78;
    w.x += w.vx;
    w.y += w.vy;

    fill(0);
    noStroke();
    textFont('Palatino');
    textSize(19);
    textAlign(LEFT, TOP);
    text(w.word, w.x, w.y);
  }

  // Nose indicator — 👈 was noFill/noStroke so invisible
  if (smoothNoseX !== undefined) {
    noFill();
    noStroke();
    strokeWeight(1);
    circle(smoothNoseX, smoothNoseY, REPEL_RADIUS * 2);
    noFill();
    noStroke();
    circle(smoothNoseX, smoothNoseY, 8);
  }
}

function gotResults(result) {
  segmentation = result;
}

function gotFaces(results) {
  faces = results;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  video.size(windowWidth, windowHeight);
  setupBox();
  initWords();
}
