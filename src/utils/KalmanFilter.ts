export class KalmanFilter {
    private R: number; // Noise covariance (measurement noise)
    private Q: number; // Process covariance (prediction noise)
    private A: number; // State transition
    private B: number; // Control input
    private C: number; // Measurement
    private cov: number; // Estimated error covariance
    private x: number; // Estimated value

    constructor(R: number = 1, Q: number = 1, A: number = 1, B: number = 0, C: number = 1) {
        this.R = R;
        this.Q = Q;
        this.A = A;
        this.B = B;
        this.C = C;
        this.cov = NaN;
        this.x = NaN; // Initial value
    }

    filter(z: number, u: number = 0): number {
        if (isNaN(this.x)) {
            this.x = (1 / this.C) * z;
            this.cov = (1 / this.C) * this.R * (1 / this.C);
        } else {
            // Predict
            const predX = (this.A * this.x) + (this.B * u);
            const predCov = ((this.A * this.cov) * this.A) + this.Q;

            // Update
            const K = predCov * this.C * (1 / ((this.C * predCov * this.C) + this.R)); // Kalman Gain
            this.x = predX + K * (z - (this.C * predX));
            this.cov = predCov - (K * this.C * predCov);
        }
        return this.x;
    }

    setParameters(R: number, Q: number) {
        this.R = R;
        this.Q = Q;
    }
}

export class LocationKalmanFilter {
    private latFilter: KalmanFilter;
    private lngFilter: KalmanFilter;
    private minAccuracy: number;

    constructor(minAccuracy: number = 1) {
        this.minAccuracy = minAccuracy;
        // R (noise) should vary with accuracy, but we set a baseline
        // Q: how fast the system changes (movement)
        this.latFilter = new KalmanFilter(minAccuracy, 1);
        this.lngFilter = new KalmanFilter(minAccuracy, 1);
    }

    process(lat: number, lng: number, accuracy: number, _timestamp: number): { lat: number, lng: number } {
        if (accuracy < this.minAccuracy) accuracy = this.minAccuracy;

        // Update noise covariance based on accuracy (in meters approx)
        // Convert meters to approx degree variance?
        // 1 degree lat approx 111km. 1m = 1/111000 degrees.
        // Variance is accuracy squared.
        // It's simpler to work in the filter's abstract units or relative.
        // Limit R to max 400 (corresponds to 20m accuracy squared) to prevent super slow convergence
        // Ideally: R should be high if we trust filter > measure, Low if we trust measure > filter.
        // For game responsiveness: we want to trust the GPS more if the filter is lagging too much behind.
        // But standard Kalman logic: High Accuracy (Low val) = Trust Measure. Low Accuracy (High val) = Trust Filter.
        // Issue: if phone reports 20m accuracy, R=400. Filter becomes very sluggish.
        // Fix: Clamp accuracy usage or scale it down.
        const effectiveAccuracy = Math.min(accuracy, 10); // Treat anything > 10m as just "10m inaccurate" to keep it moving.

        this.latFilter.setParameters(effectiveAccuracy * effectiveAccuracy, 1);
        this.lngFilter.setParameters(effectiveAccuracy * effectiveAccuracy, 1);

        const filteredLat = this.latFilter.filter(lat);
        const filteredLng = this.lngFilter.filter(lng);

        return { lat: filteredLat, lng: filteredLng };
    }
}
