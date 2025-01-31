let latitude = 0;
let longitude = 0;
let speed = 0; // Geschwindigkeit in m/s
let altitudeGPS = 0; //GPS Höhe
let headingGPS = 0; // Bewegungsrichtung basierend auf GPS
let headingGyro = 0; // Bewegungsrichtung basierend auf Gyroskop
let rotationY = 0; // Neigung (Y-Achse)
let statusText = "Starte...";
let permissionGranted = false; // Zugriff auf Sensoren
let currentPage = 'home'; // Standardseite
let link;

function setup() {
  createCanvas(windowWidth, 400); // 2D-Canvas
  textFont('sans-serif');

  if (currentPage === 'log') {
    // E-Mail Link erstellen
  link = createA('mailto:felix.leo.arens@gmail.com', 'E-Mail', '_self');
  link.position(width / 2, height / 3);
  link.style('font-size', '16px');
}

  
  // Prüfen, ob Geolocation verfügbar ist
  if ("geolocation" in navigator) {
    statusText = "Waiting for GPS ...";
    navigator.geolocation.watchPosition(
      (position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        speed = position.coords.speed || 0; // Geschwindigkeit in m/s
        altitudeGPS = position.coords.altitude; // Höhe in Metern über dem Meeresspiegel
        if (position.coords.heading !== null) {
          headingGPS = position.coords.heading; // Bewegungsrichtung in Grad
        }
        statusText = "Let's go!";
      },
      (error) => {
        console.error(error);
        statusText = "receiving no GPS data.";
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
  } else {
    statusText = "Geolocation not supported.";
  }

  // Prüfen, ob iOS eine Berechtigung erfordert
  if (typeof(DeviceOrientationEvent) !== 'undefined' && typeof(DeviceOrientationEvent.requestPermission) === 'function') {
    createPermissionButton(); // Button für iOS
  } else {
    // Android/Chrome oder andere Browser (keine Berechtigung erforderlich)
    permissionGranted = true;
    setupOrientationListener(); // Bewegungssensor aktivieren
  }
}

function draw() {
  background(255);
  textSize(width < 600 ? 20 : 30);
  
    // Wenn keine Berechtigung für Sensoren erteilt wurde
  if (!permissionGranted) {
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Please allow sensor permission", width / 2, height / 2-50);
    textSize(12);
    text("version 1.73", width / 2, height / 2+50);
    return;
  }

  if (currentPage === 'home') {
        drawHome();
    } else if (currentPage === 'log') {
        drawLog();
    } else if (currentPage === 'clock') {
        drawClock();
    }

  // Menüsteuerung
function changePage(page) {
    currentPage = page;
    document.getElementById("menuDropdown").style.display = "none"; // Menü schließen
    resizeCanvas(windowWidth, windowHeight); // Canvas neu skalieren
}

// Menü ein-/ausblenden (funktioniert auch auf Touch-Geräten)
function toggleMenu() {
    let dropdown = document.getElementById("menuDropdown");
    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
    } else {
        dropdown.style.display = "block";
    }
}

// Automatische Skalierung bei Größenänderung
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

  /////////////////////////////////////////////////
  // Seiteninhalt HOME
function drawHome() {

  textAlign(CENTER, CENTER);
  
  // Neigungsanzeiger (Wasserlibelle)
  drawInclinationIndicator();
  
  // Kursanzeige über der Windrose
  drawCourseText();

  // 2D-Overlay für GPS und Geschwindigkeit
  draw2DOverlay();

  // Kurs-Skala
  drawHeadingScale();
  
  // SteuerGenauigkeit
  drawSteeringText();

  // Versionsnummer anzeigen
  fill(0);
  textSize(10);
  text("version 1.72", 20, height - 20); // Position unten links
}
}

function drawLog() {
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Kontakt: schreib mir eine Nachricht", width / 2, height / 2);
  
}

function drawClock() {
    textSize(32);
    textAlign(CENTER, CENTER);
    fill(0);
      let h = nf(hour(), 2);
      let m = nf(minute(), 2);
      let s = nf(second(), 2);
    text(h + ':' + m + ':' + s, width / 2, height / 2);
}


  // Menüsteuerung
function changePage(page) {
    currentPage = page;
    document.getElementById("menuDropdown").style.display = "none"; // Menü schließen
}

// Dropdown ein-/ausblenden
function toggleMenu() {
    let dropdown = document.getElementById("menuDropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function drawCourseText() {
  push();
  translate(width / 2, height / 2 - 80); // Position über der Skala
  fill(0); // Farbe des Textes (Schwarz)
  textAlign(CENTER, TOP);
  textSize(40); // Schriftgröße
  textStyle(BOLD);
  text(`COG: ${headingGPS.toFixed(0)}°           SOG: ${(speed * 3.6).toFixed(1)} km/h`, 0, -90);
  translate(0,100); 
  textStyle(BOLD);
  text(`heading: ${headingGyro.toFixed(0)}°`, 0, -100); // Zentrierter Text
  pop();
}

function draw2DOverlay() {
  fill(0);
  textAlign(LEFT, CENTER);
  textSize(20);
  textStyle(BOLD);
  // Statusinformationen anzeigen
  text(statusText, 20, 20);
  text(`lon: ${latitude.toFixed(5)}`, 20, 50);
  text(`lat: ${longitude.toFixed(5)}`, 20, 80);
  text(`altitude: ${(altitudeGPS || 0).toFixed(0)} m`, 20, 110);
}



function drawHeadingScale() {
  push();
  translate(width / 2, height / 2 + 50); // Mitte der Skala
  
  let scaleWidth = width * 0.8; // Skala über 80% der Bildschirmbreite
  let scaleHeight = 40; // Höhe der Skala
  let fieldOfView = 60; // ±60° um den aktuellen Kurs

  
  function drawGradientRect(x, y, w, h, color1, color2, color3) {
  noFill();
  
  for (let i = 0; i < w; i++) {
    let inter = map(i, 0, w, 0, 1); // Interpolationsfaktor (0 bis 1)
    
    let col;
    if (inter < 0.5) {
      // Erste Hälfte: Verlauf zwischen color1 & color2
      col = lerpColor(color1, color2, inter * 2);
    } else {
      // Zweite Hälfte: Verlauf zwischen color2 & color3
      col = lerpColor(color2, color3, (inter - 0.5) * 2);
    }
    
    stroke(col);
    line(x + i, y, x + i, y + h);
  }
}

    // **3-Farben-Verlauf für die Skala**
  let c1 = color(55);  // Rot (links)
  let c2 = color(255); // Gelb (Mitte)
  let c3 = color(55);  // Blau (rechts)
  drawGradientRect(-scaleWidth / 2, -40, scaleWidth, scaleHeight + 40, c1, c2, c3);


  // **Offset sorgt für sanfte Bewegung der Skala**
  let correctedHeading = headingGyro;
  let offsetX = map(correctedHeading % 20, 0, 20, 0, scaleWidth / (fieldOfView / 10));

  // **Jetzt bewegt sich die Skala mit headingGyro!**
  for (let i = Math.floor(correctedHeading / 20) * 20 - fieldOfView; 
       i <= Math.ceil(correctedHeading / 20) * 20 + fieldOfView; 
       i += 20) { 

    let adjustedAngle = (i + 360) % 360; // Winkel auf 0-360° begrenzen

    // **Jetzt hängt die Position direkt von headingGyro ab!**
    let xPos = map(i - correctedHeading, -fieldOfView, fieldOfView, -scaleWidth / 2, scaleWidth / 2);

    let fontSize = map(abs(i - correctedHeading), 0, fieldOfView, 30, 12); // Schriftgröße abhängig von Entfernung
    let lineThickness = map(abs(i - correctedHeading), 0, fieldOfView, 4, 1); // Tick-Dicke abhängig von Entfernung

    // **Tick-Marken bewegen sich mit!**
    stroke(0);
    strokeWeight(lineThickness);
    line(xPos, -scaleHeight / 4 + 35, xPos, scaleHeight / 4 + 30);
    line(xPos, -scaleHeight / 4 - 15, xPos, scaleHeight / 4 - 50);

    // **Zahlen bleiben fix alle 20°, aber bewegen sich horizontal**
    fill(0);
    noStroke();
    textSize(fontSize);
    textAlign(CENTER, CENTER);
    text(adjustedAngle.toFixed(0), xPos, scaleHeight / 2 - 20);
  }

  pop();

  // **Rote Kurs-Nadeln bleiben statisch über der Skala**
  fill(255, 0, 0);
  noStroke();
  let needleHeight = 20;
  let needleWidth = 40;

  // **Obere Nadel (zeigt nach unten)**
  triangle(width / 2, height / 2 + 15, 
           width / 2 - needleWidth / 2, height / 2 - needleHeight,
           width / 2 + needleWidth / 2, height / 2 - needleHeight);

  // **Untere Nadel (zeigt nach oben)**
  triangle(width / 2, height / 2 + 85, 
           width / 2 - needleWidth / 2, height / 2 + 115,
           width / 2 + needleWidth / 2, height / 2 + 115);
}



function drawInclinationIndicator() {
  push();
  translate(width / 2, height - 60); // Position unter der Windrose
  let indicatorWidth = 300;
  let positionX = map(rotationY, -30, 30, -indicatorWidth / 2, indicatorWidth / 2);
  stroke(0);
  line(-indicatorWidth / 2, 0, indicatorWidth / 2, 0);
  fill(map(abs(rotationY), 0, 30, 0, 255), 255 - map(abs(rotationY), 0, 30, 0, 255), 0);
  ellipse(positionX, 0, 30, 30);
  fill(0);
  textSize(26);
  textStyle(NORMAL);
  text(`heeling: ${rotationY.toFixed(0)}°`, -70, 30);
  pop();
}


let headingHistory = []; // Liste für Heading-Werte mit Zeitstempel
let smoothingTime = 5000; // **Mittelung über 5 Sekunden**
let previousHeading = null; // Alter Kurs vor einer Wende
let steeringAccuracy = 0; // Steuergenauigkeit

function updateHeading(heading) {
  let now = millis(); // **Aktuelle Zeit**
  
  // **Neuen Wert mit Zeitstempel speichern**
  headingHistory.push({ heading: heading, time: now });

  // **Alte Werte (> `smoothingTime` ms) entfernen**
  headingHistory = headingHistory.filter(entry => now - entry.time <= smoothingTime);

  // **Gleitenden Mittelwert berechnen**
  if (headingHistory.length > 1) {
    let sum = headingHistory.reduce((acc, entry) => acc + entry.heading, 0);
    let avgHeading = sum / headingHistory.length;

    // **Steuergenauigkeit berechnen**
    steeringAccuracy = abs(heading - avgHeading).toFixed(1);
  }

  // **Wende-Erkennung (>90° Änderung)**
  if (previousHeading === null) {
    previousHeading = heading;
  } else if (abs(heading - previousHeading) > 70) {
    previousHeading = heading; // Wende erkannt → Alten Kurs aktualisieren
  }
}

function drawSteeringText() {
  push();
  translate(width / 2, height / 2 - 60); // Position über der Skala
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(24);
  textStyle(BOLD);

  // **Steuergenauigkeit anzeigen**
  fill(steeringAccuracy < 10 ? "green" : "red"); // Grün wenn genau, Rot wenn Abweichung groß
  text(`steering accuracy: ${steeringAccuracy}°`, 0, -50);

  // **Falls eine Wende erkannt wurde, alten Kurs anzeigen**
  if (previousHeading !== null) {
    fill(0);
    text(`Previous Course: ${previousHeading.toFixed(0)}°`, 0, 30);
  }

  pop();
}


function createPermissionButton() {
  let button = createButton("Request Sensor Access");
  button.style("font-size", "24px");
  button.center();
  button.mousePressed(() => {
    DeviceOrientationEvent.requestPermission().then((response) => {
      if (response === "granted") {
        permissionGranted = true;
        setupOrientationListener();
        button.remove();
      }
    });
  });
}

function requestPermissions() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
        .then(permissionState => {
            if (permissionState === 'granted') {
                console.log("Sensor-Zugriff erlaubt!");
                startCompass();
            } else {
                console.log("Sensor-Zugriff verweigert.");
            }
        })
        .catch(console.error);
    } else {
        startCompass(); // Android braucht keine Extra-Freigabe
    }
}

window.addEventListener("deviceorientation", (event) => {
    let heading = event.webkitCompassHeading || (360 - event.alpha); // iOS bevorzugt
    console.log("Magnetische Richtung:", heading.toFixed(2), "°");
});

function setupOrientationListener() {
  window.addEventListener("deviceorientation", (event) => {
    headingGyro = (360 - event.alpha) % 360;
    rotationY = event.beta || 0;
    
    // updateHeading() bei jeder Bewegung aufgerufen
    updateHeading(headingGyro);
  });
}
