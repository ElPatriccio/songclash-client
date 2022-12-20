import './App.css';
import io from 'socket.io-client';
import {useEffect, useState} from 'react';
import audioFile from './lol.mp3';

const socket = io.connect("https://failure-inn-tagged-spyware.trycloudflare.com");

const audio = new Audio();

function App() {
  const [name, setName] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [guess, setGuess] = useState("");
  const [users, setUsers] = useState("");
  const [failMsg, setFailMsg] = useState("");
  const [interpretHint, setInterpretHint] = useState("");
  const [songHint, setSongHint] = useState("");
  const [interpretHintSpan, setInterpretHintSpan] = useState(<></>);
  const [songHintSpan, setSongHintSpan] = useState(<></>);
  const [audioSrc, setAudioSrc] = useState("");


  const login = () =>{
    socket.emit("login", {userId: name});
  }

  const sendGuess = () =>{
    socket.emit("send_guess", {userId: name, guess, song: songHint, interpret: interpretHint})
    setGuess("");
  }

  const updateUsers = (serverUsers) =>{
    setUsers(serverUsers.map((user) => <li key={user}>{user}</li>))
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
      socket.emit("get_hint")
    })

    socket.on("update_users", (serverUsers) =>{
      updateUsers(serverUsers);
    })

    socket.on("recieve_hint", (data) => {
      setInterpret(data.interpret);
      setSong(data.song);
    })

    socket.on("update_interpret_hint", (interpretHintArr) =>{
      setInterpret(interpretHintArr);
    })

    socket.on("update_song_hint", (songHintArr) => {
      setSong(songHintArr);
    })

    socket.on("next_round", (song)=>{
      audio.src = audioFile;
      audio.play();
    })

    socket.on("stop", ()=>{
      audio.pause();
    })

  }, [socket])

  return (
    <div className="App">
      
      {inRoom ? 
      <>
        <div className='title'>
          <h1>Songclash</h1>
          <div className='hint'>{interpretHintSpan}</div><br/>
          <div className='hint'>{songHintSpan}</div><br/>
          <input onKeyDown={(e) => {if(e.key === "Enter"){sendGuess()}}} onChange={(e)=> setGuess(e.target.value)} value={guess} onBlur={(e) =>{e.target.focus()}} autoFocus placeholder='Guess...'></input>
          <br/>
          {audioSrc ? <audio src={audioSrc} autoplay={true} controls></audio> : ""}
        </div>
        <ul>{users}</ul>
      </>      
      : 
      <>
        <div className='title'>
          <h1>Nutzernamen eingeben</h1>
          <span className='error'>{failMsg}</span><br/> 
          <input placeholder='Name...' value={name} onChange={(e) => {setName(e.target.value); setFailMsg("")}}></input>
          <button onClick={login}>Join</button>
        </div> 
      </>
    }
    </div>
  );
}

export default App;
