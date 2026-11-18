(function () {
  'use strict';

  const LOWER = 0.24;
  const UPPER = 3.22;
  const START = [-3.50, LOWER, 2.40];
  const FOOT = [-4.35, LOWER, 2.73];
  const LANDING = [-4.35, UPPER, -0.31];
  const DESK = [2.48, LOWER, 2.77];
  const LOCATIONS = [
    { x: 4.66, z: -2.52 },
    { x: -1.31, z: -2.50 },
  ];
  const PALETTE = {
    floor: 0xd7a875, floorEdge: 0xab724b, wall: 0x77928f, night: 0x435365,
    wood: 0x916047, trim: 0xf6c789, bookshelf: 0x526d77, desk: 0x5b8077,
    amber: 0xffdc7b, ivory: 0xffedc8, rose: 0xc46f63, ink: 0x34272c,
  };

  function mount(container, onPick) {
    const T = window.MoonThree;
    if (!T) throw new Error('Three.js is unavailable.');
    const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.90;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:manipulation';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    const scene = new T.Scene();
    const overview = new T.OrthographicCamera(-7, 7, 5, -5, 0.1, 90);
    const rabbitCamera = new T.PerspectiveCamera(56, 1, 0.07, 60);
    const position = new T.Vector3();
    const sight = new T.Vector3();
    const pointer = new T.Vector2();
    const raycaster = new T.Raycaster();
    const materials = new Map();
    const geometries = {
      box: new T.BoxGeometry(1, 1, 1),
      sphere: new T.SphereGeometry(1, 14, 10),
      cylinder: new T.CylinderGeometry(1, 1, 1, 16),
      ring: new T.TorusGeometry(0.63, 0.055, 8, 32),
    };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let stage = 0;
    let scenario = 0;
    let view = 'overview';
    let motion = null;
    let frame = 0;
    let renderedAt = 0;
    let disposed = false;
    let press = null;

    function material(color, emissive = 0) {
      const key = `${color}-${emissive}`;
      if (!materials.has(key)) {
        materials.set(key, new T.MeshStandardMaterial({color, roughness: 0.86, emissive,
          emissiveIntensity: emissive ? 0.38 : 0}));
      }
      return materials.get(key);
    }

    function shape(parent, kind, color, x, y, z, sx, sy, sz, glow = 0) {
      const mesh = new T.Mesh(geometries[kind], material(color, glow));
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      parent.add(mesh);
      return mesh;
    }

    const box = (parent, ...args) => shape(parent, 'box', ...args);
    const oval = (parent, ...args) => shape(parent, 'sphere', ...args);

    const room = new T.Group();
    scene.add(room);
    scene.add(new T.HemisphereLight(0xffedcd, 0xb0bcdd, 2.45));
    const key = new T.DirectionalLight(0xffe1ae, 2.75);
    key.position.set(-4, 13, 9);
    scene.add(key);
    const rim = new T.DirectionalLight(0x9dccff, 1.23);
    rim.position.set(7, 7, -7);
    scene.add(rim);

    // A cutaway leaves the lower desk and both upstairs landmarks visible.
    box(room, PALETTE.night, 0, -0.23, 0.03, 12.4, 0.44, 7.75);
    box(room, PALETTE.floorEdge, 0, 0.02, 0.03, 12.26, 0.24, 7.6);
    box(room, PALETTE.floor, 0, 0.19, 0.03, 12.14, 0.10, 7.47);
    box(room, PALETTE.wall, 0, 2.68, -3.73, 12.22, 5.16, 0.21);
    box(room, PALETTE.trim, 0, 5.29, -3.72, 12.35, 0.17, 0.39);
    box(room, PALETTE.floorEdge, 0, UPPER - 0.13, -1.98, 12.22, 0.21, 3.4);
    box(room, PALETTE.floor, 0, UPPER - 0.045, -2.02, 12.12, 0.09, 3.38);
    box(room, PALETTE.trim, 0, UPPER - 0.10, -0.33, 12.27, 0.11, 0.11);
    box(room, PALETTE.wood, -5.84, 1.62, -0.35, 0.20, 3.11, 0.20);
    box(room, PALETTE.wood, 5.83, 1.62, -0.35, 0.20, 3.11, 0.20);
    box(room, PALETTE.trim, -5.84, 0.38, -0.35, 0.31, 0.24, 0.29);
    box(room, PALETTE.trim, 5.83, 0.38, -0.35, 0.31, 0.24, 0.29);

    [0.47, 1.60, 2.73].forEach(z => box(room, 0xc59362, 0, LOWER + 0.004, z, 11.98, 0.011, 0.025));
    [-2.99, -1.83, -0.68].forEach(z => box(room, 0xc59362, 0, UPPER + 0.004, z, 11.99, 0.011, 0.025));

    function windowPane(x, y) {
      const frame = new T.Group();
      frame.userData.target = 'window';
      room.add(frame);
      box(frame, PALETTE.wood, x, y, -3.57, 2.56, 1.38, 0.18);
      box(frame, 0xffcf79, x, y, -3.45, 2.25, 1.09, 0.08, 0xffb858);
      box(frame, 0xfbe3a1, x - 0.57, y + 0.27, -3.40, 1.04, 0.48, 0.018, 0xf5c67c);
      box(frame, PALETTE.wood, x, y, -3.36, 0.08, 1.14, 0.10);
      box(frame, PALETTE.wood, x, y, -3.36, 2.33, 0.06, 0.10);
      box(frame, PALETTE.trim, x, y - 0.64, -3.34, 2.79, 0.13, 0.35);
    }
    windowPane(3.60, 4.51);

    const bookColors = [0xd88062, 0x6d9a86, 0xe5ac60, 0x637eae, 0xe5cf99, 0x9d788e];
    function shelf(x, y, z, width, tint, rows) {
      const rack = new T.Group();
      rack.userData.target = 'books';
      rack.position.set(x, y, z);
      room.add(rack);
      box(rack, tint, 0, rows * 0.35, -0.15, width, rows * 0.7 + 0.14, 0.13);
      [-1, 1].forEach(side => box(rack, tint, side * (width / 2 - 0.06), rows * 0.35, 0,
        0.12, rows * 0.73 + 0.15, 0.61));
      for (let row = 0; row <= rows; row += 1) {
        box(rack, PALETTE.wood, 0, row * 0.70 + 0.10, 0.02, width, 0.11, 0.65);
        if (row === rows) break;
        const columns = Math.round(width / 0.29);
        for (let column = 0; column < columns; column += 1) {
          const height = 0.36 + (column * 3 % 5) * 0.037;
          const thickness = (width - 0.26) / columns;
          box(rack, bookColors[(column + row * 3) % bookColors.length],
            -width / 2 + 0.14 + (column + 0.5) * thickness,
            row * 0.70 + 0.16 + height / 2, 0.10, thickness * 0.85, height, 0.30);
        }
      }
    }
    shelf(-2.70, UPPER, -3.31, 3.32, PALETTE.bookshelf, 2);
    shelf(3.51, LOWER, -2.97, 2.63, PALETTE.wood, 3);
    shelf(-1.10, LOWER, -2.97, 2.48, PALETTE.desk, 2);

    const stairCount = 12;
    for (let step = 1; step <= stairCount; step += 1) {
      const fraction = step / stairCount;
      const height = fraction * (UPPER - LOWER);
      const z = FOOT[2] + fraction * (LANDING[2] - FOOT[2]);
      box(room, PALETTE.wood, FOOT[0], LOWER + height / 2, z, 1.09, height, 0.26);
      box(room, PALETTE.trim, FOOT[0], LOWER + height, z, 1.17, 0.055, 0.28);
      if (step % 3 === 1) {
        box(room, PALETTE.night, FOOT[0] - 0.55, LOWER + height + 0.33, z, 0.065, 0.69, 0.065);
      }
    }
    const rail = box(room, PALETTE.night, FOOT[0] - 0.55, 2.41, 1.14, 0.09, 0.09, 4.39);
    rail.rotation.x = Math.PI / 4;
    for (const x of [-3.30, -0.48, 2.16, 5.66]) {
      box(room, PALETTE.night, x, UPPER + 0.34, -0.41, 0.065, 0.68, 0.07);
    }
    for (const [x, width] of [[-1.94, 2.95], [2.62, 6.34]]) {
      box(room, PALETTE.wood, x, UPPER + 0.64, -0.41, width, 0.095, 0.10);
    }

    function plant(x, y, z) {
      shape(room, 'cylinder', 0xaa6357, x, y + 0.16, z, 0.22, 0.30, 0.22);
      shape(room, 'cylinder', PALETTE.trim, x, y + 0.31, z, 0.24, 0.07, 0.24);
      oval(room, 0x4c7466, x - 0.13, y + 0.54, z + 0.04, 0.17, 0.24, 0.12).rotation.z = 0.53;
      oval(room, 0x76967e, x + 0.13, y + 0.60, z, 0.15, 0.23, 0.12).rotation.z = -0.49;
    }
    plant(5.38, UPPER, -1.12);
    plant(-5.38, LOWER, 2.82);
    plant(5.17, LOWER, 1.48);

    // Floor textiles and a rounded animal-scale checkout counter.
    shape(room, 'cylinder', 0x527a80, 0.33, LOWER + 0.015, 2.28, 2.29, 0.035, 1.12);
    shape(room, 'cylinder', 0x689598, 0.33, LOWER + 0.033, 2.28, 2.14, 0.018, 0.98);
    shape(room, 'cylinder', 0xd99370, 0.75, UPPER + 0.015, -2.12, 1.27, 0.028, 0.73);
    const counter = new T.Group();
    counter.userData.target = 'desk';
    room.add(counter);
    box(counter, PALETTE.desk, 2.55, 0.67, 1.59, 2.95, 0.79, 1.01);
    box(counter, 0x709286, 2.55, 0.71, 2.11, 2.65, 0.55, 0.06);
    box(counter, PALETTE.trim, 2.55, 1.09, 1.59, 3.13, 0.13, 1.14);
    box(counter, PALETTE.ivory, 3.24, 1.19, 1.67, 0.52, 0.05, 0.31);
    box(counter, PALETTE.night, 1.52, 1.20, 1.55, 0.52, 0.10, 0.37);

    function animal(species, fur, shirt) {
      const figure = new T.Group();
      scene.add(figure);
      shape(figure, 'cylinder', 0x4a4039, 0, 0.016, -0.025, 0.35, 0.016, 0.25);
      oval(figure, fur, -0.18, 0.095, 0.15, 0.17, 0.10, 0.23);
      oval(figure, fur, 0.18, 0.095, 0.15, 0.17, 0.10, 0.23);
      oval(figure, shirt, 0, 0.42, 0, 0.34, 0.38, 0.29);
      oval(figure, PALETTE.ivory, 0, 0.45, 0.23, 0.15, 0.15, 0.058);
      oval(figure, fur, -0.30, 0.48, 0.08, 0.11, 0.22, 0.12).rotation.z = -0.34;
      oval(figure, fur, 0.30, 0.48, 0.08, 0.11, 0.22, 0.12).rotation.z = 0.34;
      oval(figure, fur, 0, 0.94, 0.05, 0.43, 0.38, 0.37);
      for (const side of [-1, 1]) {
        if (species === 'rabbit') {
          oval(figure, fur, side * 0.19, 1.37, 0.01, 0.115, 0.32, 0.092).rotation.z = side * -0.16;
          oval(figure, 0xe9a79e, side * 0.20, 1.39, 0.074, 0.072, 0.24, 0.036).rotation.z = side * -0.16;
        } else {
          oval(figure, fur, side * 0.31, 1.19, 0.05, 0.16, 0.16, 0.098);
          oval(figure, 0xd49d80, side * 0.32, 1.19, 0.121, 0.095, 0.089, 0.034);
        }
        oval(figure, PALETTE.ink, side * 0.145, 0.99, 0.386, 0.046, 0.055, 0.021);
        oval(figure, PALETTE.ivory, side * 0.145 + 0.012, 1.009, 0.404, 0.014, 0.014, 0.010);
        oval(figure, 0xe99a99, side * 0.249, 0.916, 0.356, 0.047, 0.029, 0.012);
      }
      oval(figure, PALETTE.ivory, 0, 0.848, 0.355, 0.168, 0.095, 0.062);
      oval(figure, PALETTE.ink, 0, 0.903, 0.409, 0.055, 0.032, 0.031);
      if (species === 'beaver') {
        oval(figure, 0x835442, 0, 0.13, -0.38, 0.20, 0.075, 0.34).rotation.x = -0.3;
        for (const x of [-0.028, 0.028]) box(figure, PALETTE.ivory, x, 0.811, 0.42, 0.051, 0.076, 0.044);
      } else {
        oval(figure, PALETTE.ivory, 0, 0.33, -0.30, 0.13, 0.13, 0.13);
        const heldBook = new T.Group();
        box(heldBook, PALETTE.bookshelf, 0.20, 0.48, 0.29, 0.30, 0.13, 0.32);
        box(heldBook, PALETTE.ivory, 0.20, 0.49, 0.306, 0.26, 0.081, 0.33);
        figure.add(heldBook);
        figure.userData.book = heldBook;
      }
      return figure;
    }

    const librarian = animal('beaver', 0xb77957, 0x58827a);
    librarian.userData.target = 'desk';
    librarian.position.set(2.56, LOWER + 0.12, 0.93);
    librarian.scale.setScalar(1.12);
    librarian.rotation.y = 0.13;
    const rabbit = animal('rabbit', 0xf2e1c2, 0xc87164);
    rabbit.position.fromArray(START);
    rabbit.rotation.y = 1.72;
    rabbit.userData.book.visible = false;

    // Each cart has a different landmark, so replay changes the upstairs route.
    const markers = LOCATIONS.map(({ x, z }, index) => {
      const cart = new T.Group();
      cart.userData.target = index ? 'shelf' : 'window';
      cart.position.set(x, UPPER, z);
      scene.add(cart);
      const tint = index ? 0xc18171 : PALETTE.desk;
      for (const side of [-1, 1]) {
        for (const end of [-1, 1]) {
          oval(cart, PALETTE.night, side * 0.42, 0.10, end * 0.25, 0.105, 0.10, 0.10);
          box(cart, PALETTE.trim, side * 0.42, 0.39, end * 0.24, 0.06, 0.62, 0.06);
        }
      }
      box(cart, tint, 0, 0.26, 0, 1.0, 0.08, 0.58);
      box(cart, tint, 0, 0.60, 0, 1.0, 0.08, 0.58);
      box(cart, PALETTE.trim, 0.46, 0.75, -0.25, 0.06, 0.08, 0.45);
      [-0.29, -0.06, 0.19].forEach((offset, i) => box(cart, bookColors[i + index],
        offset, 0.75, -0.05, 0.18, 0.21 + (i % 2) * 0.04, 0.36));
      const ring = shape(cart, 'ring', PALETTE.amber, 0, 0.04, 0, 1.04, 1.04, 1.04, 0xffab42);
      ring.rotation.x = -Math.PI / 2;
      ring.visible = false;
      return ring;
    });

    const crumbs = new T.Group();
    crumbs.userData.ignorePicking = true;
    scene.add(crumbs);
    const dots = Array.from({length: 36}, () =>
      oval(crumbs, PALETTE.amber, 0, 0, 0, 0.067, 0.045, 0.067, 0xffaf4c));
    crumbs.visible = false;

    function pathToBook(index) {
      const {x, z} = LOCATIONS[index];
      return [START, FOOT, LANDING, [-4.35, UPPER, -0.95],
        [x, UPPER, -0.95], [x, UPPER, z + 0.58]].map(point => new T.Vector3(...point));
    }

    function pathToDesk(index) {
      const previous = pathToBook(index).reverse().slice(0, 5);
      previous.push(new T.Vector3(-0.31, LOWER, 2.90), new T.Vector3(...DESK));
      return previous;
    }

    function lengthTable(path) {
      const lengths = [0];
      for (let i = 1; i < path.length; i += 1) {
        lengths.push(lengths[i - 1] + path[i].distanceTo(path[i - 1]));
      }
      return lengths;
    }

    function sample(path, lengths, fraction, target) {
      const distance = fraction * lengths.at(-1);
      let segment = 1;
      while (segment < lengths.length - 1 && distance > lengths[segment]) segment += 1;
      const relative = (distance - lengths[segment - 1]) / (lengths[segment] - lengths[segment - 1]);
      return target.copy(path[segment - 1]).lerp(path[segment], relative);
    }

    function markRoute(path) {
      const lengths = lengthTable(path);
      dots.forEach((dot, index) => {
        sample(path, lengths, (index + 1) / (dots.length + 1), dot.position);
        dot.position.y += 0.072;
      });
    }

    function render() {
      if (view === 'rabbit') {
        const yaw = rabbit.rotation.y;
        if (stage === 1) {
          // Preview what the rabbit will see at the top of the stairs.
          rabbitCamera.position.set(-4.42, UPPER + 1.27, -0.50);
          sight.set(1.20, UPPER + 0.53, -2.14);
        } else if (stage === 2 && rabbit.userData.book.visible) {
          const { x, z } = LOCATIONS[scenario];
          rabbitCamera.position.set(x - 0.36, UPPER + 1.08, z + 0.93);
          sight.set(x, UPPER + 0.63, z);
        } else {
          rabbitCamera.position.copy(rabbit.position).add(position.set(Math.sin(yaw) * 0.42, 1.08, Math.cos(yaw) * 0.42));
          sight.copy(rabbitCamera.position).add(position.set(Math.sin(yaw) * 4, -0.54, Math.cos(yaw) * 4));
        }
        rabbitCamera.lookAt(sight);
      }
      rabbit.visible = view !== 'rabbit';
      renderer.render(scene, view === 'rabbit' ? rabbitCamera : overview);
    }

    function resize() {
      if (disposed) return;
      const width = Math.max(1, Math.round(container.clientWidth));
      const height = Math.max(1, Math.round(container.clientHeight));
      const aspect = width / height;
      renderer.setSize(width, height, false);
      const target = new T.Vector3(0, 2.48, 0.08);
      overview.position.set(12, 10.3, 17.4).add(target);
      overview.lookAt(target);
      const right = new T.Vector3(1, 0, 0).applyQuaternion(overview.quaternion);
      const up = new T.Vector3(0, 1, 0).applyQuaternion(overview.quaternion);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const corners = [
        [-6.25, -0.47, -3.95], [-6.25, -0.47, 3.95], [6.25, -0.47, -3.95], [6.25, -0.47, 3.95],
        [-6.25, 5.43, -3.95], [6.25, 5.43, -3.95], [-6.25, 4.88, -0.18], [6.25, 4.88, -0.18],
      ];
      for (const corner of corners) {
        position.fromArray(corner).sub(target);
        const x = position.dot(right), y = position.dot(up);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const vertical = Math.max(maxY - minY + 0.55, (maxX - minX + 0.60) / aspect);
      overview.left = centerX - vertical * aspect / 2;
      overview.right = centerX + vertical * aspect / 2;
      overview.bottom = centerY - vertical / 2;
      overview.top = centerY + vertical / 2;
      overview.updateProjectionMatrix();
      rabbitCamera.aspect = aspect;
      rabbitCamera.updateProjectionMatrix();
      render();
    }

    function stopMovement() {
      cancelAnimationFrame(frame);
      frame = 0;
      motion = null;
    }

    function pickFromPointer(event) {
      if (!press || press.id !== event.pointerId) return;
      const distance = Math.hypot(press.x - event.clientX, press.y - event.clientY);
      press = null;
      if (distance > 8) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
        1 - (event.clientY - rect.top) / rect.height * 2);
      raycaster.setFromCamera(pointer, view === 'rabbit' ? rabbitCamera : overview);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (const hit of hits) {
        let target = null;
        let visible = true;
        for (let object = hit.object; object; object = object.parent) {
          if (!object.visible || object.userData.ignorePicking) visible = false;
          target ||= object.userData.target;
        }
        if (visible) {
          onPick(target || 'empty');
          return;
        }
      }
      onPick('empty');
    }

    if (typeof onPick === 'function') {
      renderer.domElement.addEventListener('pointerdown', event => {
        if (event.isPrimary && event.button === 0) press = { id: event.pointerId, x: event.clientX, y: event.clientY };
      });
      renderer.domElement.addEventListener('pointermove', event => {
        if (press?.id === event.pointerId && Math.hypot(press.x - event.clientX, press.y - event.clientY) > 8) press = null;
      });
      renderer.domElement.addEventListener('pointerup', pickFromPointer);
      renderer.domElement.addEventListener('pointercancel', () => { press = null; });
    }

    function place(movement, fraction) {
      sample(movement.path, movement.lengths, fraction, rabbit.position);
      const before = Math.max(0, fraction - 0.012);
      const after = Math.min(1, fraction + 0.012);
      sample(movement.path, movement.lengths, before, position);
      sample(movement.path, movement.lengths, after, sight).sub(position);
      if (Math.abs(sight.x) + Math.abs(sight.z) > 0.0001) rabbit.rotation.y = Math.atan2(sight.x, sight.z);
      rabbit.userData.book.visible = stage === 3 || stage === 2 && fraction >= 0.99;
    }

    function move(time) {
      if (!motion || disposed) return;
      const span = Math.min(1, (time - motion.started) / motion.duration);
      if (time - renderedAt > 27 || span === 1) {
        const eased = span * span * (3 - 2 * span);
        place(motion, eased);
        render();
        renderedAt = time;
      }
      if (span < 1) frame = requestAnimationFrame(move);
      else stopMovement();
    }

    function setStage(nextStage, nextScenario = 0) {
      const normalizedStage = [0, 1, 2, 3].includes(nextStage) ? nextStage : 0;
      const normalizedScenario = nextScenario === 1 ? 1 : 0;
      if (normalizedStage === stage && normalizedScenario === scenario) return;
      stopMovement();
      stage = normalizedStage;
      scenario = normalizedScenario;
      markers.forEach((marker, index) => { marker.visible = index === scenario && stage > 0 && stage < 3; });
      crumbs.visible = stage > 1;
      if (stage < 2) {
        rabbit.position.fromArray(START);
        rabbit.rotation.y = stage === 0 ? 1.72 : -1.82;
        rabbit.userData.book.visible = false;
        render();
        return;
      }
      const path = stage === 2 ? pathToBook(scenario) : pathToDesk(scenario);
      markRoute(path);
      motion = { path, lengths: lengthTable(path), started: performance.now(), duration: stage === 2 ? 3100 : 2450 };
      place(motion, reducedMotion.matches ? 1 : 0);
      if (reducedMotion.matches) stopMovement();
      render();
      if (motion) frame = requestAnimationFrame(move);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    return {
      setStage,
      setView(nextView) {
        view = nextView === 'rabbit' ? 'rabbit' : 'overview';
        render();
      },
      dispose() {
        disposed = true;
        stopMovement();
        observer.disconnect();
        Object.values(geometries).forEach(geometry => geometry.dispose());
        materials.forEach(item => item.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      },
    };
  }

  window.MoonMapScene = { mount };
}());
