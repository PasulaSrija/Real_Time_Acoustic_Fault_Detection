import numpy as np
from scipy.signal import butter, sosfiltfilt


def filter_signal(signal, fs):
    sos = butter(
        4,
        800,
        btype="lowpass",
        fs=fs,
        output="sos"
    )

    return sosfiltfilt(sos, signal)


def calculate_rms(signal):
    return np.sqrt(np.mean(signal ** 2))


def calculate_peak(signal):
    return np.max(np.abs(signal))


def calculate_fft(signal, fs):
    n = len(signal)

    window = np.hanning(n)

    spectrum = np.fft.rfft(
        signal * window
    )

    frequencies = np.fft.rfftfreq(
        n,
        1 / fs
    )

    magnitude = (
        2 / n
    ) * np.abs(spectrum)

    return frequencies, magnitude


def dominant_frequency(signal, fs):
    frequencies, magnitude = calculate_fft(
        signal,
        fs
    )

    index = np.argmax(
        magnitude[1:]
    ) + 1

    return frequencies[index]


def extract_features(signal, fs):
    filtered = filter_signal(
        signal,
        fs
    )

    frequencies, magnitude = calculate_fft(
        filtered,
        fs
    )

    return {
        "rms": calculate_rms(filtered),
        "peak": calculate_peak(filtered),
        "dominant_frequency": dominant_frequency(
            filtered,
            fs
        ),
        "frequency_amplitude": np.max(
            magnitude[1:]
        )
    }