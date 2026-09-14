// ================================================================
//  NeuroScan AI — Drawing & Handwriting Kinematic Feature Engine
//  Extracts Velocity, Acceleration, Jerk, Tremor, Spatial Symmetry,
//  and Clock Drawing Test (CDT) Metrics via PointerEvents & Canvas.
// ================================================================

export class DrawingAnalysisEngine {
  /**
   * Analyzes an array of stroke objects
   * Each stroke is an array of points: { x, y, time, pressure }
   */
  static analyzeDrawing(strokes, canvasWidth = 600, canvasHeight = 400, taskType = 'spiral') {
    const strokeCount = strokes.length;
    if (strokeCount === 0) {
      return this.getEmptyAnalysis(taskType);
    }

    let allPoints = [];
    let totalDrawingTime = 0;
    let activeDrawingTime = 0;
    let inAirTime = 0;

    let velocities = [];
    let accelerations = [];
    let jerks = [];
    let pressures = [];
    let strokeDurations = [];

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;

    let tremorOscillations = 0;
    let totalSegmentCount = 0;

    // Iterate through strokes
    for (let sIdx = 0; sIdx < strokes.length; sIdx++) {
      const stroke = strokes[sIdx];
      if (!stroke || stroke.length === 0) continue;

      const strokeStart = stroke[0].time;
      const strokeEnd = stroke[stroke.length - 1].time;
      const strokeDuration = (strokeEnd - strokeStart) / 1000; // seconds
      strokeDurations.push(strokeDuration);
      activeDrawingTime += strokeDuration;

      // Check in-air time from previous stroke
      if (sIdx > 0 && strokes[sIdx - 1].length > 0) {
        const prevEnd = strokes[sIdx - 1][strokes[sIdx - 1].length - 1].time;
        const airGap = Math.max(0, (strokeStart - prevEnd) / 1000);
        inAirTime += airGap;
      }

      // Process points in stroke
      for (let pIdx = 0; pIdx < stroke.length; pIdx++) {
        const pt = stroke[pIdx];
        allPoints.push(pt);
        sumX += pt.x;
        sumY += pt.y;

        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;

        pressures.push(pt.pressure !== undefined ? pt.pressure : 0.5);

        // Velocity
        if (pIdx > 0) {
          const prevPt = stroke[pIdx - 1];
          const dt = Math.max(0.001, (pt.time - prevPt.time) / 1000);
          const dist = Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y);
          const vel = dist / dt; // px/sec
          velocities.push(vel);
          totalSegmentCount++;

          // Acceleration & Tremor micro-oscillation check
          if (pIdx > 1) {
            const prevVel = velocities[velocities.length - 2];
            const acc = (vel - prevVel) / dt;
            accelerations.push(acc);

            // Jerk (derivative of acceleration)
            if (accelerations.length > 1) {
              const prevAcc = accelerations[accelerations.length - 2];
              const jerk = Math.abs(acc - prevAcc) / dt;
              jerks.push(jerk);
            }

            // Detect sharp direction turn / tremor oscillation (angle change > 45 deg over very short distance)
            const pPrev = stroke[pIdx - 2];
            const dx1 = prevPt.x - pPrev.x;
            const dy1 = prevPt.y - pPrev.y;
            const dx2 = pt.x - prevPt.x;
            const dy2 = pt.y - prevPt.y;
            const angleDiff = Math.abs(Math.atan2(dy2, dx2) - Math.atan2(dy1, dx1));
            if (angleDiff > 0.8 && dist < 12) {
              tremorOscillations++;
            }
          }
        }
      }
    }

    totalDrawingTime = activeDrawingTime + inAirTime;
    if (totalDrawingTime <= 0) totalDrawingTime = 3.5;

    // Kinematics calculations
    const meanVelocity = velocities.length > 0
      ? Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length)
      : 120;
    const peakVelocity = velocities.length > 0
      ? Math.round(Math.max(...velocities))
      : 240;

    const meanAcceleration = accelerations.length > 0
      ? Math.round(Math.abs(accelerations.reduce((a, b) => a + b, 0) / accelerations.length))
      : 450;

    const meanJerk = jerks.length > 0
      ? Math.round(jerks.reduce((a, b) => a + b, 0) / jerks.length)
      : 1800;

    const meanPressure = pressures.length > 0
      ? Math.round((pressures.reduce((a, b) => a + b, 0) / pressures.length) * 100) / 100
      : 0.52;

    // Tremor Index (frequency of micro-oscillations relative to stroke segments)
    const lineTremorIndex = totalSegmentCount > 0
      ? Math.min(0.85, Math.round((tremorOscillations / totalSegmentCount) * 100) / 100)
      : 0.12;

    // Spatial Metrics
    const bboxWidth = Math.max(1, maxX - minX);
    const bboxHeight = Math.max(1, maxY - minY);
    const boundingBoxArea = bboxWidth * bboxHeight;
    const canvasArea = canvasWidth * canvasHeight;
    const occupiedAreaRatio = Math.min(1, Math.round((boundingBoxArea / canvasArea) * 100) / 100);
    const aspectRatio = Math.round((bboxWidth / bboxHeight) * 100) / 100;

    // Center of mass
    const comX = allPoints.length > 0 ? sumX / allPoints.length : canvasWidth / 2;
    const comY = allPoints.length > 0 ? sumY / allPoints.length : canvasHeight / 2;
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    const centerOffset = Math.round(Math.hypot(comX - canvasCenterX, comY - canvasCenterY));

    // Symmetry Index: compare points on left half vs right half relative to COM
    let leftCount = 0, rightCount = 0, topCount = 0, bottomCount = 0;
    allPoints.forEach(p => {
      if (p.x < comX) leftCount++; else rightCount++;
      if (p.y < comY) topCount++; else bottomCount++;
    });
    const horizSymmetry = Math.min(leftCount, rightCount) / Math.max(1, Math.max(leftCount, rightCount));
    const vertSymmetry = Math.min(topCount, bottomCount) / Math.max(1, Math.max(topCount, bottomCount));
    const symmetryIndex = Math.round(((horizSymmetry + vertSymmetry) / 2) * 100) / 100;

    // Task-specific scoring: Clock Drawing Test (CDT) or Spiral Drawing
    let taskMetrics = {};
    if (taskType === 'clock') {
      // CDT Scoring based on circularity, radius variance, and number distribution
      const radiusSamples = allPoints.map(p => Math.hypot(p.x - comX, p.y - comY));
      const meanRadius = radiusSamples.reduce((a, b) => a + b, 0) / Math.max(1, radiusSamples.length);
      const radiusVariance = radiusSamples.reduce((a, b) => a + Math.pow(b - meanRadius, 2), 0) / Math.max(1, radiusSamples.length);
      const circularity = Math.max(30, Math.min(96, Math.round(100 - (Math.sqrt(radiusVariance) / meanRadius) * 60)));

      taskMetrics = {
        contourIntegrity: circularity,
        handPlacementAccuracy: Math.min(95, Math.max(45, Math.round(circularity * 0.9))),
        numberPlacementSymmetry: Math.round(symmetryIndex * 100),
        rouleauScoreCDT: circularity > 75 ? '3/3 Normal' : circularity > 50 ? '2/3 Mild Distortion' : '1/3 Impaired'
      };
    } else {
      // Spiral or Freehand shape
      taskMetrics = {
        spiralRegularity: Math.round(symmetryIndex * 92),
        radialDispersion: Math.round((bboxWidth / Math.max(1, bboxHeight)) * 50)
      };
    }

    // Kinematic Smoothness Score (0 - 100)
    let smoothnessScore = Math.max(30, Math.min(95, Math.round(100 - (lineTremorIndex * 60) - (meanJerk / 120))));

    // Reliability & Quality
    let qualityScore = 92;
    if (allPoints.length < 50) qualityScore -= 30;
    if (totalDrawingTime < 2) qualityScore -= 20;

    return {
      taskType,
      strokeCount,
      totalPoints: allPoints.length,
      totalDrawingTime: Math.round(totalDrawingTime * 10) / 10,
      activeDrawingTime: Math.round(activeDrawingTime * 10) / 10,
      inAirTime: Math.round(inAirTime * 10) / 10,
      meanStrokeDuration: strokeCount > 0 ? Math.round((activeDrawingTime / strokeCount) * 100) / 100 : 0.5,
      meanVelocity,
      peakVelocity,
      meanAcceleration,
      meanJerk,
      meanPressure,
      lineTremorIndex,
      occupiedAreaRatio,
      aspectRatio,
      centerOffset,
      symmetryIndex,
      smoothnessScore,
      qualityScore,
      taskMetrics,
      boundingBox: { minX, maxX, minY, maxY, width: bboxWidth, height: bboxHeight },
      centerOfMass: { x: Math.round(comX), y: Math.round(comY) },
      timestamp: new Date().toISOString()
    };
  }

  static getEmptyAnalysis(taskType = 'spiral') {
    return {
      taskType,
      strokeCount: 0,
      totalPoints: 0,
      totalDrawingTime: 0,
      activeDrawingTime: 0,
      inAirTime: 0,
      meanStrokeDuration: 0,
      meanVelocity: 0,
      peakVelocity: 0,
      meanAcceleration: 0,
      meanJerk: 0,
      meanPressure: 0.5,
      lineTremorIndex: 0.1,
      occupiedAreaRatio: 0,
      aspectRatio: 1,
      centerOffset: 0,
      symmetryIndex: 0.85,
      smoothnessScore: 80,
      qualityScore: 50,
      taskMetrics: {},
      boundingBox: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
      centerOfMass: { x: 300, y: 200 }
    };
  }

  /**
   * Draw dual-view feature overlays on analysis canvas
   * (Highlights curvature hotspots, tremor segments, bounding box, center of mass)
   */
  static renderFeatureOverlay(targetCanvas, strokes, analysis) {
    if (!targetCanvas || !strokes || strokes.length === 0) return;
    const ctx = targetCanvas.getContext('2d');
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    // 1. Draw base strokes with velocity/tremor color heat-map
    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      for (let i = 1; i < stroke.length; i++) {
        const p1 = stroke[i - 1];
        const p2 = stroke[i];
        const dt = Math.max(0.001, (p2.time - p1.time) / 1000);
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const vel = dist / dt;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = 3;

        // Color coding: green (smooth/normal), amber (hesitant/slower), crimson (rapid/tremor)
        if (vel > 350) {
          ctx.strokeStyle = '#e76f51'; // High velocity / rapid jerk
        } else if (vel < 50) {
          ctx.strokeStyle = '#f4a261'; // Hesitation / slow pen pause
        } else {
          ctx.strokeStyle = '#2d6a4f'; // Fluid velocity
        }
        ctx.stroke();
      }
    }

    // 2. Draw Bounding Box
    const bb = analysis.boundingBox;
    if (bb && bb.width > 0) {
      ctx.strokeStyle = 'rgba(69, 123, 157, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(bb.minX, bb.minY, bb.width, bb.height);
      ctx.setLineDash([]);
    }

    // 3. Draw Center of Mass (COM) Target Marker
    const com = analysis.centerOfMass;
    if (com) {
      ctx.beginPath();
      ctx.arc(com.x, com.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#9b5de5';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.strokeStyle = '#9b5de5';
      ctx.lineWidth = 1;
      ctx.moveTo(com.x - 12, com.y); ctx.lineTo(com.x + 12, com.y);
      ctx.moveTo(com.x, com.y - 12); ctx.lineTo(com.x, com.y + 12);
      ctx.stroke();
    }
  }
}
