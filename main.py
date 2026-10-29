from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd

from signal_generator import generate_signals
from signal_processing import (
    extract_features,
    filter_signal,
    calculate_fft
)


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


model = joblib.load("model.pkl")


@app.get("/")
def home():

    return {
        "message": "Real-Time Acoustic Fault Detection Backend Running"
    }


@app.get("/detect/{fault}")
def detect_fault(fault: str):

    rpm = 1500

    if fault == "imbalance":
        rpm = 1450

    elif fault == "misalignment":
        rpm = 1480

    elif fault == "loose_mounting":
        rpm = 1400

    fs = 2000


    t, acoustic, sensors = generate_signals(
        fault=fault,
        rpm=rpm,
        fs=fs
    )


    features = []


    acoustic_features = extract_features(
        acoustic,
        fs
    )


    features.append(
        acoustic_features["rms"]
    )

    features.append(
        acoustic_features["peak"]
    )

    features.append(
        acoustic_features["dominant_frequency"]
    )


    sensor_rms = []

    filtered_sensors = []


    for i in range(4):

        sensor_features = extract_features(
            sensors[i],
            fs
        )


        features.append(
            sensor_features["rms"]
        )

        features.append(
            sensor_features["peak"]
        )

        features.append(
            sensor_features["dominant_frequency"]
        )


        sensor_rms.append(
            sensor_features["rms"]
        )


        filtered = filter_signal(
            sensors[i],
            fs
        )


        filtered_sensors.append(
            filtered
        )


    feature_names = [
        "acoustic_rms",
        "acoustic_peak",
        "acoustic_frequency",
        "s1_rms",
        "s1_peak",
        "s1_frequency",
        "s2_rms",
        "s2_peak",
        "s2_frequency",
        "s3_rms",
        "s3_peak",
        "s3_frequency",
        "s4_rms",
        "s4_peak",
        "s4_frequency"
    ]


    input_data = pd.DataFrame(
        [features],
        columns=feature_names
    )


    prediction = model.predict(
        input_data
    )[0]


    probabilities = model.predict_proba(
        input_data
    )[0]


    confidence = max(probabilities) * 100


    strongest_sensor = sensor_rms.index(
        max(sensor_rms)
    )


    selected_signal = filtered_sensors[
        strongest_sensor
    ]


    frequencies, magnitude = calculate_fft(
        selected_signal,
        fs
    )


    waveform_length = 500


    waveform_indices = np.linspace(
        0,
        len(selected_signal) - 1,
        waveform_length
    ).astype(int)


    waveform = selected_signal[
        waveform_indices
    ]


    fft_limit = 200


    frequencies = frequencies[
        :fft_limit
    ]

    magnitude = magnitude[
        :fft_limit
    ]


    if prediction == "normal":

        severity = "Normal"
        status = "RUNNING"

    elif prediction == "loose_mounting":

        severity = "Critical"
        status = "SAFE STOP"

    else:

        severity = "Warning"
        status = "RUNNING"


    return {

        "fault": prediction,

        "confidence": round(
            confidence,
            2
        ),

        "location":
            f"Sensor {strongest_sensor + 1}",

        "severity": severity,

        "status": status,

        "sensor_rms": sensor_rms,

        "rpm": rpm,

        "waveform":
            waveform.tolist(),

        "frequency":
            frequencies.tolist(),

        "spectrum":
            magnitude.tolist()

    }