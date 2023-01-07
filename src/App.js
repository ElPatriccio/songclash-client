import './App.css';
import io from 'socket.io-client';
import {useEffect, useState} from 'react';
import audioFile from './lol.mp3';
import useExternalScripts from './hooks/useExternalScript';

const socket = io.connect("https://autumn-left-hay-plasma.trycloudflare.com");

const audio = new Audio();


function App() {
  const [name, setName] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [guess, setGuess] = useState("");
  const [users, setUsers] = useState("");
  const [points, setPoints] = useState("");
  const [interpretIcon, setInterpretIcon] = useState("");
  const [songIcon, setSongIcon] = useState("");
  const [milliseconds, setMilliseconds] = useState(<></>);
  const [failMsg, setFailMsg] = useState("");
  const [interpretHint, setInterpretHint] = useState("");
  const [songHint, setSongHint] = useState("");
  const [interpretHintSpan, setInterpretHintSpan] = useState(<></>);
  const [songHintSpan, setSongHintSpan] = useState(<></>);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [timeColor, setTimeColor] = useState("green");

  useExternalScripts("https://kit.fontawesome.com/83e4b3ca38.js");

  const login = () =>{
    socket.emit("login", {userId: name});
  }

  const sendGuess = () =>{
    socket.emit("send_guess", {userId: name, guess, song: songHint, interpret: interpretHint})
    setGuess("");
  }

  const skipSong = () =>{
    socket.emit("skip_song", name);
  }

  const updateUsers = (serverUsers) =>{
    if(!serverUsers) return;
    let key = 0;
    setUsers(serverUsers.map((user) => <h4 key={key++}>{user}</h4>))
  }

  const updatePoints = (serverPoints) => {
    let key = 0;
    setPoints(serverPoints.map((point) => <h4 key={key++}>{point}</h4>))
  }

  const updateIconColors = (serverColors) =>{
    let key = 0;
    setInterpretIcon(serverColors.map((colors) => {
      let classNameString = 'fa-solid fa-user ' + colors[0];
      return <h4 key={key++}><i className={classNameString}></i></h4>
    }));

    setSongIcon(serverColors.map((colors) => {
      let classNameString = 'fa-solid fa-music ' + colors[1];
      return <h4 key={key++}><i className={classNameString}></i></h4>;
    }));
  }

  const updateMilliseconds = (serverMilliseconds) => {
    let key = 0;
    setMilliseconds(serverMilliseconds.map((milli) => {
      if(milli != '')return <h4 key={key++}>{milli + 'ms'}</h4>;
      else return <h4 key={key++}>-</h4>;
    }))
  }

  const setInterpret = (array) =>{
    setInterpretHint(array);
    setInterpretHintSpan(mapHint(array));
  }

  const setSong = (array) =>{
    setSongHint(array);
    setSongHintSpan(mapHint(array));
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

      updateUsers(data.users);
    })

    socket.on("update_leaderboard", (data) =>{
      if(data.users) updateUsers(data.users);
      if(data.points) updatePoints(data.points);
      if(data.iconColors) updateIconColors(data.iconColors);
      if(data.milliseconds) updateMilliseconds(data.milliseconds);
    })

    socket.on("update_interpret_hint", (interpretHintArr) =>{
      let guessed = true;
      for (let i = 0; i < interpretHintArr.length; i++) {
        if(/__*/.test(interpretHintArr[i])) guessed = false; 
      }
      setInterpret(interpretHintArr);
    })

    socket.on("update_song_hint", (songHintArr) => {
      let guessed = true;
      for (let i = 0; i < songHintArr.length; i++) {
        if(/__*/.test(songHintArr[i])){
          guessed = false; 
        }
      }
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

      }
    })

    socket.on("next_round", (data)=>{
      setInterpret(data.interpret);
      setSong(data.song);
      audio.src = audioFile;
      audio.volume = 0.3;
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
          <input className='slider' type='range' min='0' max='10' defaultValue='3'></input>
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
            <div className='grid-item'>
              {users}
            </div>
            <div className='grid-item'>
              {points}
            </div>
            <div className='grid-item'>
              {interpretIcon}
            </div>
            <div className='grid-item'>
              {songIcon}
            </div>
            <div className='grid-item'>
              {milliseconds}
            </div>
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
