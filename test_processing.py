from signal_generator import generate_signals
from signal_processing import extract_features


fs = 2000

t, acoustic, sensors = generate_signals(
    fault="imbalance",
    fs=fs
)

features = extract_features(
    sensors[2],
    fs
)

print("Sensor 3 Features")
print("------------------")

for key, value in features.items():
    print(
        f"{key}: {value:.4f}"
    )