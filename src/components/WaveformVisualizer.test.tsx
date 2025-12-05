import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WaveformVisualizer from './WaveformVisualizer';

describe('WaveformVisualizer', () => {
  beforeEach(() => {
    // Mock HTMLCanvasElement.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      fillStyle: '',
      fillRect: vi.fn(),
    })) as any;

    // Mock AudioContext as a class
    class MockAudioContext {
      createAnalyser = vi.fn(() => ({
        fftSize: 2048,
        frequencyBinCount: 1024,
        getByteFrequencyData: vi.fn(),
        connect: vi.fn(),
      }));
      createMediaStreamSource = vi.fn(() => ({
        connect: vi.fn(),
      }));
      close = vi.fn();
    }

    window.AudioContext = MockAudioContext as any;
    (window as any).webkitAudioContext = MockAudioContext;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders a canvas element', () => {
    const { container } = render(<WaveformVisualizer isActive={false} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders with custom class name', () => {
    const { container } = render(<WaveformVisualizer isActive={false} className="test-class" />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('test-class');
  });

  it('initializes AudioContext when active and stream is provided', () => {
    const mockStream = {} as MediaStream;
    // We can spy on the window.AudioContext itself if it was a function,
    // but since we replaced it with a class, we can check if instances were created
    // or just check if the methods on the prototype were called if we spied on them.

    // However, since we define the mock class inside beforeEach, we can't easily spy on the constructor
    // unless we wrap it.

    const MockAudioContextSpy = vi.fn();
    class MockAudioContext {
      constructor() {
        MockAudioContextSpy();
      }
      createAnalyser = vi.fn(() => ({
        fftSize: 2048,
        frequencyBinCount: 1024,
        getByteFrequencyData: vi.fn(),
        connect: vi.fn(),
      }));
      createMediaStreamSource = vi.fn(() => ({
        connect: vi.fn(),
      }));
      close = vi.fn();
    }

    window.AudioContext = MockAudioContext as any;
    (window as any).webkitAudioContext = MockAudioContext;

    render(<WaveformVisualizer isActive={true} stream={mockStream} />);

    expect(MockAudioContextSpy).toHaveBeenCalled();
  });
});
