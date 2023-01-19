import './App.css';
import io from 'socket.io-client';
import {useEffect, useRef, useState} from 'react';
import useExternalScripts from './hooks/useExternalScript';

const socket = io.connect("http://localhost:3001");
const audio = new Audio();

function App() {
  const [name, setName] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [guess, setGuess] = useState("");
  const [leaderboard, setLeaderboard] = useState("");
  const [failMsg, setFailMsg] = useState("");
  const [interpretHint, setInterpretHint] = useState("");
  const [songHint, setSongHint] = useState("");
  const [interpretHintSpan, setInterpretHintSpan] = useState(<></>);
  const [songHintSpan, setSongHintSpan] = useState(<></>);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [timeColor, setTimeColor] = useState("green");
  const volume = useRef(0.3);
  const [volumeDisplay, setVolumeDisplay] = useState(0.3);
  const [mute, setMute] = useState(false);
  const [progressVal, setProgressVal] = useState(0);

  useExternalScripts("https://kit.fontawesome.com/83e4b3ca38.js");

  const login = () =>{
    socket.emit("login", {userId: name});
  }

  const sendGuess = () =>{
    socket.emit("send_guess", {guess, song: songHint, interpret: interpretHint})
    setGuess("");
  }

  const skipSong = () =>{
    socket.emit("skip_song", name);
  }

  const updateLeaderboard = (users) => {
    let key = 0;
    return users.map((user) =>
      <> 
        <div className='grid-item'>
          <span>{user.name}</span>
        </div>
        <div className='grid-item'>
          <span>{user.points}</span>
        </div>
        <div className='grid-item'>
          <span><i className={'fa-solid fa-user ' + user.iconColor[0]}></i></span>
        </div>
        <div className='grid-item'>
          <span><i className={'fa-solid fa-music ' + user.iconColor[1]}></i></span>
        </div>
        <div className='grid-item'>
          <span>{user.milliseconds === 0 ? '-' : user.milliseconds + 'ms'}</span>
        </div>
      </>
    )
  }

  const setInterpret = (array) =>{
    setInterpretHint(array);
    setInterpretHintSpan(mapHint(array));
  }

  const setSong = (array) =>{
    setSongHint(array);
    setSongHintSpan(mapHint(array));
  }

  const changeVolume = (e) => {
    volume.current = ((e.target.value / 10));
    setVolumeDisplay((e.target.value / 10))
    audio.volume = volume.current;
  }

  const updateMute = () => {
    setMute(!mute);
    volume.current = !mute ? 0 : volumeDisplay;   //!mute wegen dem huan state async
    audio.volume = volume.current;
  }

  const mapHint = (arr) =>{
    let newArr = [];
    for (let i = 0; i < arr.length; i++) {
      if(!(/__*/.test(arr[i]))){
          newArr.push(<span className='correctGuess'>{arr[i]}</span>);
      }
      else{
          newArr.push(<span>{arr[i]}</span>)
      }
    }
    return newArr;
  }

  useEffect(() =>{
    socket.on("login_authorized", (data) =>{
      setInRoom(data.authorized)

      if(!data.authorized){
        setFailMsg(data.message);
        return;
      }
    })

    socket.on("update_leaderboard", (serverUsers) =>{
      setLeaderboard(updateLeaderboard(serverUsers))
    })

    socket.on("update_interpret_hint", (interpretHintArr) =>{
      setInterpret(interpretHintArr);
    })

    socket.on("update_song_hint", (songHintArr) => {
      setSong(songHintArr);
    })

    socket.on("update_timer", (time) =>{
      setTimeRemaining(time);
      switch(time){
        case 29: {
          setTimeColor("green"); 
          break;
        }
        case 20: {
          setTimeColor("orange");
          break;
        }
        case 0:
        case 10: {
          setTimeColor("red");
          break;
        }
        default:
          break;
      }    
    })

    socket.on("next_round", (data)=>{
      setInterpret(data.interpret);
      setSong(data.song);
      audio.src = require('./../songs/' + data.path)      
      audio.volume = mute ? 0 : volume.current;
      audio.play();
      setTimeRemaining(30);
      
    })

    socket.on("stop_round", ()=>{
      audio.pause();
    })

  }, [socket]) 
  
  return (
    <>
    <div className="App">
      
      {inRoom ? 
      <>
      <div className='everything'>
        <div className='center'>
          <h2 className='volume-bar'>{mute ? <i onClick={() => updateMute()} className="fa-solid fa-volume-xmark volume"></i> : <i onClick={()=>updateMute()}className="fa-solid fa-volume-high volume"></i>}<input className='slider' onChange={(e) => {changeVolume(e)}} type='range' min='0' max='10' defaultValue='3'></input></h2>
          <div className='circle'>
              <div className='guess-area'>
                <h1 className={'time ' + timeColor}>{timeRemaining}</h1>
                <div className='hint-area'>
                  <div className='hint'>{interpretHintSpan}</div>
                  <div className='hint'>{songHintSpan}</div>
                </div>
                <input className='guess-input' onKeyDown={(e) => {if(e.key === "Enter"){sendGuess()}}} onPaste={() => {return false;}} onChange={(e)=> setGuess(e.target.value)} value={guess} onBlur={(e) =>{e.target.focus()}} autoFocus placeholder='Guess...'></input>
                <br/>
                <br/>
                <br/>
                <button className='skip-button' onClick={skipSong}>Next Song</button>
              </div>
            </div>
          </div>
          <div className='grid'>
            {leaderboard}
          </div>
      </div>
        
      </>      
      : 
      <>
        <div className='title'>
          <h1>Nutzernamen eingeben</h1>
          <span className='error'>{failMsg}</span><br/> 
          <input onKeyDown={(e) => {if(e.key === "Enter"){login()}}} placeholder='Name...' value={name} onChange={(e) => {setName(e.target.value); setFailMsg("")}}></input>
          <button onClick={login}>Join</button>
        </div> 
      </>
    }
    </div>
    </>
  );
}

export default App;
