import matplotlib.pyplot as plt

from signal_generator import generate_signals


t, acoustic, sensors = generate_signals(
   fault="misalignment"
)

plt.figure(figsize=(10, 5))

plt.plot(
    t,
    sensors[2]
)

plt.xlabel("Time (seconds)")
plt.ylabel("Vibration")
plt.title("Sensor 3 - Imbalance")

plt.show()