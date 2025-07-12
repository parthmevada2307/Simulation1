let state = "choose";
let voiceType = null;
let bgImg;

let mic, fft;
let isListening = false;
let isFrozen = false;

let waveScroll = 0;
let waveSpeed = 2;

let stopBtn, backBtn, playBtn;
let overlayAlpha = 150;

let lineYPositions = [];
let allColors = ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"];
let vibgyorColors = [
  "#FF0000", "#FFA500", "#FFFF00",
  "#00FF00", "#0000FF", "#4B0082", "#8F00FF"
];

let wavelengthMap = [];
let activeLineIndex = null;
let frozenWaveIndex = null;

function preload() {
  bgImg = loadImage('https://www.shutterstock.com/image-vector/abstract-music-notes-wavy-background-600nw-2478080513.jpg');
}

function setup() {
  createCanvas(1000, 1000);
  textAlign(CENTER, CENTER);
  textFont('Georgia');
  noStroke();

  createChoiceButtons();

  mic = new p5.AudioIn();
  fft = new p5.FFT(0.1, 2048);

  let topMargin = 200;
  let bottomMargin = height - 150;
  for (let i = 0; i < allColors.length; i++) {
    let y = map(i, 0, allColors.length - 1, topMargin, bottomMargin);
    lineYPositions.push(y);
  }

  for (let i = 0; i < allColors.length; i++) {
    let wl = map(i, 0, allColors.length - 1, 300, 80);
    wavelengthMap.push(wl);
  }
}

function draw() {
  if (state === "choose") {
    drawChoiceScreen();
  } else if (state === "listen") {
    drawListeningScreen();
  }
}

function drawChoiceScreen() {
  if (bgImg) image(bgImg, 0, 0, width, height);
  else background(0);

  fill(0, 0, 0, overlayAlpha);
  rect(0, 0, width, height);

  fill(255);
  textSize(48);
  textStyle(BOLD);
  text("🎵 Choose Your Voice Type!", width / 2, 150);

  if (voiceType) {
    textSize(32);
    fill('#ffff66');
    text(`You chose: ${voiceType}`, width / 2, 700);
  }
}

function drawListeningScreen() {
  background(0, 40);
  drawBlackGrid();
  drawWhiteGuideLines();

  if (isListening && !isFrozen) {
    let freqData = fft.analyze();
    let maxIndex = freqData.indexOf(max(freqData));
    let nyquist = sampleRate() / 2;
    let currentFreq = maxIndex * nyquist / freqData.length;

    activeLineIndex = mapFrequencyToLine(currentFreq);

    if (activeLineIndex !== null) {
      frozenWaveIndex = activeLineIndex;
    }
  }

  if (frozenWaveIndex !== null) {
    drawSmoothWaveOnLine(frozenWaveIndex);
  }
}

function drawWhiteGuideLines() {
  stroke(255, 180);
  strokeWeight(2);
  for (let y of lineYPositions) {
    line(0, y, width, y);
  }
}

function drawSmoothWaveOnLine(index) {
  let yPos = lineYPositions[index];
  let col = vibgyorColors[index];
  let wavelength = wavelengthMap[index];
  let amplitude = 50;

  stroke(col);
  strokeWeight(4);
  noFill();

  beginShape();
  for (let x = 0; x < width; x += 5) {
    let angle = (x + waveScroll) / wavelength * TWO_PI;
    let y = yPos + sin(angle) * amplitude;
    curveVertex(x, y);
  }
  endShape();

  waveScroll += waveSpeed;

  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = col;
  drawingContext.shadowBlur = 0;
}

function mapFrequencyToLine(freq) {
  let minFreq = 100;
  let maxFreq = 520;
  if (freq < minFreq || freq > maxFreq) return null;

  let bandWidth = (maxFreq - minFreq) / allColors.length;
  for (let i = 0; i < allColors.length; i++) {
    let bandStart = minFreq + i * bandWidth;
    let bandEnd = bandStart + bandWidth;
    if (freq >= bandStart && freq < bandEnd) {
      return i;
    }
  }
  return null;
}

function createChoiceButtons() {
  let yBase = 300;
  let spacing = 90;

  let kidBtn = createButton("👶 Kid");
  kidBtn.position(width / 2 - 75, yBase);
  styleButton(kidBtn, '#4caf50', '#81c784');
  kidBtn.mousePressed(() => selectVoice("Child"));

  let gentBtn = createButton("👨 Gent");
  gentBtn.position(width / 2 - 75, yBase + spacing + 10);
  styleButton(gentBtn, '#2196f3', '#64b5f6');
  gentBtn.mousePressed(() => selectVoice("Male"));

  let ladyBtn = createButton("👩 Lady");
  ladyBtn.position(width / 2 - 75, yBase + 2 * spacing + 15);
  styleButton(ladyBtn, '#e91e63', '#f06292');
  ladyBtn.mousePressed(() => selectVoice("Female"));
}

function selectVoice(type) {
  voiceType = type;
  removeElements();
  state = "listen";
  isListening = false;
  isFrozen = false;
  frozenWaveIndex = null;

  // Add Play button instead of starting immediately
  playBtn = createButton("▶️ Play");
  playBtn.position(300, 20);
  styleButton(playBtn, '#4caf50', '#81c784');
  playBtn.mousePressed(playMic);

  backBtn = createButton("🔙 Back");
  backBtn.position(500, 20);
  styleButton(backBtn, '#9e9e9e', '#cfcfcf');
  backBtn.mousePressed(goBack);
}

function playMic() {
  userStartAudio();
  mic.start(() => {
    fft.setInput(mic);
    isListening = true;
    isFrozen = false;
  });

  if (playBtn) playBtn.remove();

  stopBtn = createButton("⏸ Freeze");
  stopBtn.position(300, 20);
  styleButton(stopBtn, '#f44336', '#e57373');
  stopBtn.mousePressed(stopMic);
}

function goBack() {
  if (isListening) {
    mic.stop();
    isListening = false;
  }
  isFrozen = false;
  frozenWaveIndex = null;
  removeElements();
  createChoiceButtons();
  state = "choose";
}

function stopMic() {
  isFrozen = true;
}

function drawBlackGrid() {
  stroke('#00cccc');
  strokeWeight(0.5);
  for (let x = 0; x < width; x += 50) line(x, 0, x, height);
  for (let y = 0; y < height; y += 50) line(0, y, width, y);
}

function styleButton(btn, color1, color2) {
  btn.style('width', '120px');
  btn.style('height', '40px');
  btn.style('font-size', '20px');
  btn.style('border', 'none');
  btn.style('border-radius', '10px');
  btn.style('color', 'white');
  btn.style('cursor', 'pointer');
  btn.style('background', `linear-gradient(45deg, ${color1}, ${color2})`);
  btn.style('box-shadow', `0 4px 10px 0 ${color2}`);
  btn.mouseOver(() => btn.style('filter', 'brightness(1.2)'));
  btn.mouseOut(() => btn.style('filter', 'brightness(1)'));
}
