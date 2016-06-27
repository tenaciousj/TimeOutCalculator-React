import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Button } from 'react-bootstrap';

var defaultState = {
  timeInputs: {
    items: []
  },
  result: '',
  mode: "lastOut",
  hrsToWork: 8
};


function addTimeInput() {
  return {
    type: 'ADD_TIME_INPUT'
  };
}

function calculate() {
  return {
    type: 'CALCULATE'
  };
}

function updateHoursToWork(hours) {
  return {
    type: 'UPDATE_HRS_TO_WORK',
    hours: hours
  };
}

function tocApp(state, action) {
  switch (action.type) {
    case 'ADD_TIME_INPUT':
      var items = [].concat(state.timeInputs.items);
      var newMode;
      (state.mode == "lastOut") ? newMode = "lastIn" : newMode = "lastOut";
      return Object.assign({}, state, {
        timeInputs: {
          items: items.concat([{}])
        },
        result: '',
        mode: newMode
      });
    case 'CALCULATE':
      var newResult = calcResult(state.hrsToWork, state.mode);
      return Object.assign({}, state, {
        result: newResult
      });
    case 'UPDATE_HRS_TO_WORK':
      return Object.assign({}, state, {
        hrsToWork: action.hours,
        result: ''
      });
    default:
      return state;
  }
}

/*
  Returns time in hours (decimal to include minutes)
*/
function getEnteredTime(str) {
  var h = parseInt(str.substring(0, str.indexOf(":")));
  var m = parseInt(str.substring(str.indexOf(":")+1, str.length));
  m /= 60;
  return h+m;
}

/*
  Adds hours to a date
*/
Date.prototype.addHours = function(h) {
   this.setTime(this.getTime() + (h*60*60*1000));
   return this;
}

/*
  Calculates how much more time is needed
*/
function calcResult(hoursToWork, mode) {

  if(hoursToWork > 16){
    document.getElementById("result").innerHTML = "You have exceeded the 16 hour limit. Take a break!";
    return "You have exceeded the 16 hour limit. Take a break!";
  }

  var hoursWorked = 0;
  var hoursLeft = 0;
  var minsLeft = 0;
  var resultStr, meridiem;
  var lastOutHour;

  var length = document.getElementsByClassName('timeInputs').length;
  //to account for indices
  if(length % 2 == 0){
    length = (length/2)+1;
  } else {
    length = Math.ceil(length/2);
  }
  for(var i = 1; i < length; i++){
    var inDOM = document.getElementById("In-" + i);
    var outDOM = document.getElementById("Out-" + i);
    if(typeof inDOM == "undefined" || typeof outDOM == "undefined" || inDOM.value == "" || outDOM.value == ""){
      return "";
    }
    var inTime = inDOM.value;
    var outTime = outDOM.value;
    var inHour = getEnteredTime(inTime);
    var outHour = getEnteredTime(outTime);

    hoursWorked += outHour - inHour;
    //to account for noon/midnight
    if(outHour < inHour) {
      hoursWorked += 1;
    }
    lastOutHour = outHour;

  }
  //make sure last input has been entered if the last was an "In"
  if(mode == "lastIn" && document.getElementById("In-" + length).value == "") {
    return "";
  }
  hoursLeft = hoursToWork - hoursWorked;

  //last input was an "Out" time
  if(mode == "lastOut"){
    minsLeft = Math.round((hoursLeft - Math.floor(hoursLeft))*60);
    hoursLeft = Math.floor(hoursLeft);
    if(hoursLeft < 0 || (hoursLeft == 0 && minsLeft == 0) ) {
      resultStr = "<strong>HOORAY!</strong> You've finished all your hours for today :)";
    } else {
      resultStr = "<strong>" + hoursLeft + " hours, " + minsLeft + " minutes left!</strong> Don't forget to clock back in!";
    }
  }
  //last input was an "In" time
  else if (mode == "lastIn") {
    var lastInTime = document.getElementById("In-" + length).value;
    var lastInHour = getEnteredTime(lastInTime);
    var lastInMin = Math.round((lastInHour - Math.floor(lastInHour))*60);

    if(lastInHour < lastOutHour){
      resultStr = "Oops! It looks like your last in time is before your last out time. Check your times and try again."
      document.getElementById('result').innerHTML = resultStr;
      return resultStr;
    }

    //oldNow will have date to compare against now (in case time goes into next day/month/year)
    var oldNow = new Date(1);
    var now = new Date(1);

    now.setHours(lastInHour);
    now.setMinutes(lastInMin);
    now.addHours(hoursLeft);

    var endHour = now.getHours();
    var endMin = now.getMinutes();

    //if it is a new year
    var newYear = oldNow.getYear() < now.getYear();
    //if it is a new month
    var newMonth = oldNow.getMonth() < now.getMonth();
    //if it is a new day
    var newDay = (oldNow.getMonth() == now.getMonth()) && (oldNow.getDate() < now.getDate());
    //it will go into the next day (invalid)
    if(newYear || newMonth || newDay) {
        resultStr = "<strong>This goes into the next day...</strong> Try entering in an earlier time.";
        document.getElementById('result').innerHTML = resultStr;
        return resultStr;
    }
    //otherwise, it's in the same day (valid)
    else {
      if(endHour > 12){
        endHour -= 12;
        meridiem = "PM";
      } else {
        meridiem = "AM";
      }
    }
    //pretty print the minutes
    if (endMin < 10){
      endMin = "0" + endMin;
    }
    resultStr = "To work " + hoursToWork + " hours, stay strong until <strong>" + endHour + ":" + endMin + meridiem + "</strong>!";
  }
  else {
    returnStr = 'Error. Please try again later.';
  }
  document.getElementById('result').innerHTML = resultStr;
  return resultStr;
}




var store = createStore(tocApp, defaultState);

class HoursToWork extends React.Component {

  handleChange(event) {
    store.dispatch(updateHoursToWork(event.target.value));
    store.dispatch(calculate());
  }
  render() {
    return (
      <p>
        <em>How many hours will you work today?</em> &nbsp;
        <input
          type="number"
          defaultValue='8'
          min='0'
          max='16'
          onChange={this.handleChange.bind(this)}
        />
        <br />
      </p>

    );
  }
}

class AddTimeBtn extends React.Component {
  state = {
    mode: ''
  };

  componentWillMount() {
    store.subscribe(() => {
      var state = store.getState();
      this.setState({
        mode: state.mode
      });
    });
  }

  onBtnClick() {
    store.dispatch(addTimeInput());
  }

  render() {
    var t, bsStyle, style;
    if(this.state.mode == "lastIn") {
      bsStyle = "info";
      t = "Out";
    } else {
      bsStyle = "warning";
      t = "In";
    }
    style = {
      outline: 'none',
      fontSize: '7px'
    };
    return (
      <p>
        <Button bsSize="xsmall" bsStyle={bsStyle} id="addTime" style={style} onClick={this.onBtnClick}>Add Time {t}</Button>
      </p>
    );
  }
}

class TimeInput extends React.Component {
  onInputChange() {
    store.dispatch(calculate());
  }
  render() {
    return (
      <span> {this.props.mode}: <input type="time" id={this.props.id} className= "timeInputs" onChange={this.onInputChange}/></span>
    );
  }
}

class TimeInputList extends React.Component {
  state = {
    items: [],
    result: '',
    mode: ''
  };

  componentWillMount() {
    store.subscribe(() => {
      var state = store.getState();
      this.setState({
        items: state.timeInputs.items,
        result: state.result,
        mode: state.mode
      });
    });
  }

  determineMode(index) {
    var mode;
    if(index % 2 == 0) {
      mode = "Time In";
    } else {
      mode = "Time Out";
    }
    return mode;
  }

  determineId(index){
    if(index % 2 == 0){
      return "In-" + ((index/2)+1);
    } else {
      return "Out-" + (Math.ceil(index/2));
    }
  }

  render() {
    var lineStyle = {
      color: 'lightgray'
    };
    var items = [];
    this.state.items.forEach((item, index) => {
      items.push(<li>
        <TimeInput
        key={index}
        index={index}
        id={this.determineId(index)}
        mode={this.determineMode(index)}
        />
      <div style={lineStyle}>___________________________</div>
      <br />
      </li>);
    });
    var ulStyle = {
      listStyle: 'none',
      paddingLeft: '0'
    };
    return (
      <span>
      <ul style={ulStyle}>{ items }</ul>
      <div id="result"></div>
      </span>
    );
  }
}

class PageHeader extends React.Component {
  render() {
    var pageHeaderStyle = {
      fontSize: '18px',
      marginLeft: '10px'
    };
    return (
      <span>
      <div class="page-header">
        <h1 style={pageHeaderStyle}>Time Out Calculator <small>Calculate what time you can go home</small></h1>
      </div>
      <hr />
      </span>
    );
  }
}

var contentDivStyle = {
  marginLeft: '70px',
  fontSize: '7px'
};

ReactDOM.render(
  <span>
  <PageHeader />
    <div id="content" style={contentDivStyle}>
      <HoursToWork />
      <AddTimeBtn />
      <TimeInputList />
    </div>
  </span>,
  document.getElementById('container')
);
