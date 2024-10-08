import React from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()));
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

class App extends React.Component {
  state = {
    location: "",
    isLoading: false,
    displayLocation: "",
    weather: {},
  };

  getWeather = async () => {
    if (this.state.location.length < 2) return this.setState({ weather: {} });
    this.setState({ isLoading: true });
    try {
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);

      console.log({ latitude, longitude, timezone, name, country_code });
      console.log(`${name} ${convertToFlag(country_code)}`);
      this.setState({
        displayLocation: `${name} ${convertToFlag(country_code)}`,
      });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      console.log(weatherData.daily);
      this.setState({ weather: weatherData.daily });
    } catch (err) {
      console.error(err);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handleInput = (e) => this.setState({ location: e.target.value });

  // useEffect[]
  componentDidMount() {
    this.setState({ location: localStorage.getItem("location") || "" });
  }
  // useEffect[location]
  componentDidUpdate(prevProps, prevState) {
    if (this.state.location !== prevState.location) {
      this.getWeather();
      localStorage.setItem("location", this.state.location);
    }
  }
  render() {
    return (
      <div className="app">
        <h1>Classy Weather</h1>
        <Input
          location={this.state.location}
          onLocationChange={this.handleInput}
        />
        {/* <input type="button" value="Get Weather" onClick={this.getWeather} /> */}
        {this.state.isLoading && <p className="loader">Loading...</p>}
        {this.state.weather.time && (
          <Weather
            weather={this.state.weather}
            location={this.state.displayLocation}
          />
        )}
      </div>
    );
  }
}

export default App;

class Input extends React.Component {
  render() {
    return (
      <div>
        <input
          type="text"
          placeholder="Search from location ..."
          value={this.props.location}
          onChange={this.props.onLocationChange}
        />
      </div>
    );
  }
}

class Weather extends React.Component {
  componentWillUnmount() {
    console.log("Weather component unmount");
  }
  render() {
    const {
      temperature_2m_max: max,
      temperature_2m_min: min,
      time: date,
      weathercode: code,
    } = this.props.weather;
    console.log(this.props);
    return (
      <div>
        <h2>Weather {this.props.location}</h2>
        <ul className="weather">
          {date.map((ele, i) => (
            <Day
              max={max.at(i)}
              min={min.at(i)}
              date={ele}
              code={code.at(i)}
              isToday={i === 0}
              key={i}
            />
          ))}
        </ul>
      </div>
    );
  }
}

class Day extends React.Component {
  render() {
    const { max, min, date, code, isToday } = this.props;
    console.log(this.props);
    return (
      <li className="day">
        <span>{getWeatherIcon(code)}</span>
        <p>{isToday ? "Today" : formatDay(date)}</p>
        <p>
          {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}</strong>
        </p>
      </li>
    );
  }
}
