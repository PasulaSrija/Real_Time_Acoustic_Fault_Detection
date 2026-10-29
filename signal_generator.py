import numpy as np


def generate_signals(
    fault="normal",
    rpm=1500,
    duration=2,
    fs=2000
):
    t = np.arange(0, duration, 1 / fs)

    rotation_frequency = rpm / 60

    rng = np.random.default_rng()

    acoustic = 0.05 * np.sin(2 * np.pi * rotation_frequency * t)

    sensors = []

    sensor_gains = [0.8, 1.0, 1.2, 0.9]

    for i in range(4):
        signal = (
            0.08 * sensor_gains[i]
            * np.sin(2 * np.pi * rotation_frequency * t)
        )

        if fault == "normal":
            signal += 0.02 * np.sin(
                2 * np.pi * 50 * t
            )

        elif fault == "imbalance":
            if i == 2:
                signal += 0.45 * np.sin(
                    2 * np.pi * rotation_frequency * t
                )
            else:
                signal += 0.12 * np.sin(
                    2 * np.pi * rotation_frequency * t
                )

            acoustic += 0.12 * np.sin(
                2 * np.pi * rotation_frequency * t
            )

        elif fault == "misalignment":
            if i in [1, 2]:
                signal += (
                    0.25 * np.sin(
                        2 * np.pi * rotation_frequency * t
                    )
                    + 0.22 * np.sin(
                        2 * np.pi * 2 * rotation_frequency * t
                    )
                    + 0.10 * np.sin(
                        2 * np.pi * 3 * rotation_frequency * t
                    )
                )
            else:
                signal += 0.08 * np.sin(
                    2 * np.pi * rotation_frequency * t
                )

            acoustic += 0.15 * np.sin(
                2 * np.pi * 2 * rotation_frequency * t
            )

        elif fault == "loose_mounting":
            frequencies = [25, 50, 75, 125, 200, 400, 700]

            for frequency in frequencies:
                amplitude = 0.05

                if i == 3:
                    amplitude = 0.18

                signal += amplitude * np.sin(
                    2 * np.pi * frequency * t
                )

            acoustic += 0.20 * np.sin(
                2 * np.pi * 200 * t
            )

        noise = rng.normal(
            0,
            0.015,
            len(t)
        )

        signal += noise

        sensors.append(signal)

    acoustic += rng.normal(
        0,
        0.01,
        len(t)
    )

    return t, acoustic, np.array(sensors)