let latitude = 0;
let longitude = 0;
let speed = 0; // Geschwindigkeit in m/s
let altitudeGPS = 0; //GPS Höhe
let headingGPS = 0; // Bewegungsrichtung basierend auf GPS
let headingGyro = 0; // Bewegungsrichtung basierend auf Gyroskop
let rotationY = 0; // Neigung (Y-Achse)
let statusText = "Starte...";
let permissionGranted = false; // Zugriff auf Sensoren

function setup() {
  createCanvas(windowWidth, 400); // 2D-Canvas
  textFont('sans-serif');


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

  // Wenn keine Berechtigung für Sensoren erteilt wurde
  if (!permissionGranted) {
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Please allow sensor permission", width / 2, height / 2-50);
    textSize(12);
    text("version 1.2", width / 2, height / 2+50);
    return;
  }

  // Neigungsanzeiger (Wasserlibelle)
  drawInclinationIndicator();
  
  // Kursanzeige über der Windrose
  drawCourseText();

  // 2D-Overlay für GPS und Geschwindigkeit
  draw2DOverlay();

  // Kurs-Skala
  drawHeadingScale();

  // Versionsnummer anzeigen
  fill(0);
  textSize(10);
  text("version 1.2", 20, height - 20); // Position unten links
}

function drawCourseText() {
  push();
  translate(width / 2, height / 2 - 80); // Position über der Skala
  fill(0); // Farbe des Textes (Schwarz)
  textAlign(CENTER, TOP);
  textSize(36); // Schriftgröße
  textStyle(BOLD);
  
  /*
  text(`COG: ${headingGPS.toFixed(0)}°           SOG: ${(speed * 3.6).toFixed(1)} km/h`, 0, -90);
  translate(0,100); 
  textStyle(BOLD);
  text(`heading: ${headingGyro.toFixed(0)}°`, 0, -100); // Zentrierter Text
  */
  
    text(`COG: ${headingGPS.toFixed(0)}°    SOG: ${(speed * 3.6).toFixed(1)} km/h`, 0, -90);
  text(`Heading: ${headingGyro.toFixed(0)}°`, 0, -50);

  // **Steuergenauigkeit anzeigen**
  fill(steeringAccuracy < 10 ? "green" : "red"); // Grün wenn genau, Rot wenn Abweichung groß
  text(`Steering Accuracy: ${steeringAccuracy}°`, 0, -10);

  // **Falls eine Wende erkannt wurde, alten Kurs anzeigen**
  if (previousHeading !== null) {
    fill(0);
    text(`Previous Course: ${previousHeading.toFixed(0)}°`, 0, 30);
  }
  
  
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
  text(`altitude: ${altitudeGPS.toFixed(0)} m`, 20, 110);
}

function drawHeadingScale() {
  push();
  translate(width / 2, height / 2 + 50); // Mitte der Skala

  let scaleWidth = width * 0.95; // Skala auf 95% der Bildschirmbreite
  let scaleHeight = 40; // Höhe der Skala
  let fieldOfView = 60; // ±60° um den aktuellen Kurs

  // **Clip-Bereich setzen**
  beginClip(-scaleWidth / 2, -scaleHeight / 2, scaleWidth, scaleHeight * 2);

  fill(240);
  rect(0, 0, scaleWidth, scaleHeight + 40);

  for (let i = Math.floor(headingGyro / 20) * 20 - fieldOfView; 
       i <= Math.ceil(headingGyro / 20) * 20 + fieldOfView; 
       i += 20) { 

    let adjustedAngle = (i + 360) % 360;
    let xPos = map(i - headingGyro, -fieldOfView, fieldOfView, -scaleWidth / 2, scaleWidth / 2);

    // **Fading am Rand mit Alpha-Wert**
    let fade = map(abs(i - headingGyro), fieldOfView * 0.7, fieldOfView, 255, 0); 
    fade = constrain(fade, 0, 255); // Sicherstellen, dass Alpha zwischen 0 und 255 bleibt

    let fontSize = map(abs(i - headingGyro), 0, fieldOfView, 30, 12);
    let lineThickness = map(abs(i - headingGyro), 0, fieldOfView, 4, 1);

    // **Markierungen zeichnen (mit Transparenz!)**
    stroke(0, fade);
    strokeWeight(lineThickness);
    line(xPos, -scaleHeight / 4 + 35, xPos, scaleHeight / 4 + 30);
    line(xPos, -scaleHeight / 4 - 15, xPos, scaleHeight / 4 - 50);

    // **Zahlen mit Fading**
    fill(0, fade);
    noStroke();
    textSize(fontSize);
    textAlign(CENTER, CENTER);
    text(adjustedAngle.toFixed(0), xPos, scaleHeight / 2 - 20);
  }

  endClip(); // Clip-Bereich schließen
  pop();

  // **Rote Kurs-Nadeln bleiben statisch über der Skala**
  fill(255, 0, 0);
  noStroke();
  let needleHeight = 20;
  let needleWidth = 40;

  // **Obere Nadel (zeigt nach unten)**
  triangle(width / 2, height / 2 + 20, 
           width / 2 - needleWidth / 2, height / 2 - needleHeight,
           width / 2 + needleWidth / 2, height / 2 - needleHeight);

  // **Untere Nadel (zeigt nach oben)**
  triangle(width / 2, height / 2 + 80, 
           width / 2 - needleWidth / 2, height / 2 + 100,
           width / 2 + needleWidth / 2, height / 2 + 100);
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
  let avgHeading = headingHistory.reduce((sum, entry) => sum + entry.heading, 0) / headingHistory.length;

  // **Steuergenauigkeit berechnen (Abweichung vom Mittelwert)**
  steeringAccuracy = abs(heading - avgHeading).toFixed(1);

  // **Wende-Erkennung (>90° Änderung)**
  if (previousHeading === null) {
    previousHeading = heading;
  } else if (abs(heading - previousHeading) > 90) {
    previousHeading = heading; // Wende erkannt → Alten Kurs aktualisieren
  }
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

function setupOrientationListener() {
  window.addEventListener("deviceorientation", (event) => {
    headingGyro = (360 - event.alpha) % 360;
    rotationY = event.beta || 0;
  });
}
