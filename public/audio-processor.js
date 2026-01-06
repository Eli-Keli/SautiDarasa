// AudioWorklet processor for capturing PCM audio
class AudioRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isRecording = false;
    this.isPaused = false;

    // Listen for messages from the main thread
    this.port.onmessage = (event) => {
      if (event.data.command === 'start') {
        this.isRecording = true;
        this.isPaused = false;
      } else if (event.data.command === 'stop') {
        this.isRecording = false;
      } else if (event.data.command === 'pause') {
        this.isPaused = true;
      } else if (event.data.command === 'resume') {
        this.isPaused = false;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (this.isRecording && !this.isPaused && input && input[0]) {
      // Get the first channel (mono)
      const channelData = input[0];
      
      // Send the audio data to the main thread
      this.port.postMessage({
        type: 'audioData',
        data: channelData.slice(0), // Clone the Float32Array
      });
    }

    // Keep the processor alive
    return true;
  }
}

registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
