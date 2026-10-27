class Timer {
    constructor(durationInSeconds, onTick = null, onComplete = null) {
        this.initialDuration = durationInSeconds;
        this.timeRemaining = durationInSeconds;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.intervalId = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.timeRemaining--;

            if (this.onTick) {
                this.onTick(this.timeRemaining);
            }

            if (this.timeRemaining <= 0) {
                this.stop();
                if (this.onComplete) {
                    this.onComplete();
                }
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) {
            return;
        }

        clearInterval(this.intervalId);
        this.intervalId = null;
        this.isRunning = false;
    }

    reset(newDuration = null) {
        this.stop();
        this.timeRemaining = newDuration !== null ? newDuration : this.initialDuration;
        if (this.onTick) {
            this.onTick(this.timeRemaining);
        }
    }

    stop() {
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.isRunning = false;
    }

    getTimeRemaining() {
        return this.timeRemaining;
    }
}