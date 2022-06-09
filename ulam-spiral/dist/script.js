class Stage {
  constructor(config) {
    this.config = config;
  }

  init() {
    this.setupCanvas();
    this.setupZoom();
    this.setupStage();
    this.setupWorker();
    this.setupListeners();
  }

  setupCanvas() {
    const canvas = this.canvas = document.createElement('canvas');

    canvas.height = this.config.el.clientHeight;
    canvas.width = this.config.el.clientWidth;
    canvas.style = 'position: absolute; left: 0; top: 0; margin: 0; padding: 0';

    this.config.el.appendChild(this.canvas);
  }

  setupZoom() {
    this.zoomed = false;

    const canvas = this.zoomedCanvas = document.createElement('canvas');
    const ctx = this.zoomedCtx = canvas.getContext('2d');

    canvas.height = this.config.el.clientHeight * this.config.zoom;
    canvas.width = this.config.el.clientWidth * this.config.zoom;
    canvas.style = 'position: absolute; left: 0; top: 0; margin: 0; padding: 0;';

    ctx.fillStyle = this.config.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  setupStage() {
    const scale = this.config.scale;
    const ctx = this.ctx = this.canvas.getContext('2d');
    const h = this.h = this.canvas.height + scale;
    const w = this.w = this.canvas.width + scale;
    const longestSide = h >= w ? h : w;

    this.cols = Math.floor(w / scale);
    this.rows = Math.floor(h / scale);
    this.maxy = Math.floor(this.rows / 2);
    this.miny = Math.floor(-this.rows / 2);

    ctx.fillStyle = this.config.bg;
    ctx.fillRect(0, 0, w, h);

    this.area = Math.floor(longestSide * longestSide / Math.pow(this.config.scale, 2));
    this.primes = [];
  }

  setupListeners() {
    // this.config.el.addEventListener('click', e => {
    //   this.showZoom()
    // })
  }

  setupWorker() {
    const blob = new Blob([getprimez.textContent], { type: 'text/javascript' });
    this.worker = new Worker(window.URL.createObjectURL(blob));

    this.worker.addEventListener('message', e => {
      const index = e.data;
      const cell = new Cell(this, index);
      // const zoomedCell = new Cell(this, index, this.config.zoom)

      window.requestAnimationFrame(() => {
        cell.draw();
        // zoomedCell.draw()
      });
    });

    this.worker.postMessage(this.area);

  }

  showZoom() {
    if (!this.imgData) {
      let imgdata = new Image();
      imgdata.src = this.canvas.toDataURL();
      this.imgData = imgdata;
    }

    if (!this.zoomedImgData) {
      let zoomedata = new Image();
      zoomedata.src = this.zoomedCanvas.toDataURL();
      this.zoomedImgData = zoomedata;
    }

    if (!this.zoomed) {
      this.ctx.drawImage(this.zoomedImgData, -this.zoomedImgData.width / 2, -this.zoomedImgData.height / 2);
      return this.zoomed = true;
    }

    this.ctx.drawImage(this.imgData, 0, 0);
    return this.zoomed = false;
  }}


class Cell {
  constructor(stage, i, zoom) {
    const coords = getSpiralCoords(i);
    coords[0] += Math.floor(stage.cols / 2);
    coords[1] += Math.floor(stage.rows / 2);

    const realCoords = coords.slice();
    realCoords[0] = zoom ? realCoords[0] * (stage.config.scale + zoom) : realCoords[0] * stage.config.scale;
    realCoords[1] = zoom ? realCoords[1] * (stage.config.scale + zoom) : realCoords[1] * stage.config.scale;

    this.i = i;
    this.coords = coords;
    this.realCoords = realCoords;
    this.stage = stage;
    this.zoom = zoom;
  }

  draw() {
    const ctx = this.zoom ? this.stage.zoomedCtx : this.stage.ctx;
    const hue = map(this.coords[1], this.stage.miny, this.stage.maxy, 220, 340);
    const size = this.zoom ? this.stage.config.scale + this.zoom : this.stage.config.scale;

    ctx.fillStyle = `hsla(${hue}, 100%, 50%, 1)`;
    ctx.fillRect(this.realCoords[0], this.realCoords[1], size, size);
  }}


const stage = new Stage({
  el: document.getElementById('primez'),
  scale: 1,
  bg: 'hsla(0, 0, 0, 0)',
  zoom: 5 });


stage.init();

// ...
// https://stackoverflow.com/a/20591835/343520
function getSpiralCoords(tileNum) {
  var intRoot = Math.floor(Math.sqrt(tileNum));
  var x = Math.round(intRoot / 2) * Math.pow(-1, intRoot + 1) + Math.pow(-1, intRoot + 1) * (intRoot * (intRoot + 1) - tileNum - Math.abs(intRoot * (intRoot + 1) - tileNum)) / 2;
  var y = Math.round(intRoot / 2) * Math.pow(-1, intRoot) + Math.pow(-1, intRoot + 1) * (intRoot * (intRoot + 1) - tileNum + Math.abs(intRoot * (intRoot + 1) - tileNum)) / 2;

  return [x, y];
}

function map(n, start1, stop1, start2, stop2) {
  return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
};