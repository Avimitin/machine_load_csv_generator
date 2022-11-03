export default {
  responsive: true,
  interaction: {
    mode: "index" as const,
    intersect: false,
  },
  stacked: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "CPU Usage & Loggedin Users",
    },
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: "Day of the month",
      }
    },
    load: {
      type: "linear" as const,
      display: true,
      position: "left" as const,
      max: 400,
      min: 0,
      title: {
        display: true,
        text: "CPU Usage (100%)"
      },
    },
    users: {
      type: "linear" as const,
      display: true,
      position: "right" as const,
      title: {
        display: true,
        text: "Amount of users"
      },
      grid: {
        drawOnChartArea: false,
      },
      max: 20,
      min: 0,
    },
  },
};
