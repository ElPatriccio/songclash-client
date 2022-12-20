import './App.css';
import io from 'socket.io-client';
import {useEffect, useState} from 'react';

const socket = io.connect("http://localhost:3001");

function App() {
  const [name, setName] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [guess, setGuess] = useState("");
  const [users, setUsers] = useState("");
  const [failMsg, setFailMsg] = useState("");


  const login = () =>{
    socket.emit("login", {userId: name});
  }

  const sendGuess = () =>{
    socket.emit("send_guess", {userId: name, guess})
    setGuess("");
  }

  const updateUsers = (serverUsers) =>{
    setUsers(serverUsers.map((user) => <li>{user}</li>))
  }


  useEffect(() =>{
    socket.on("login_authorized", (data) =>{
      setInRoom(data.authorized)

      if(!data.authorized){
        setFailMsg(data.message);
        return;
      }

      updateUsers(data.users);

    socket.on("update_users", (serverUsers) =>{
      updateUsers(serverUsers);
    })
  })
  }, [socket])

  return (
    <div className="App">
      
      {inRoom ? 
      <>
        <div className='title'>
          <h1>Songclash</h1>
          <input onKeyDown={(e) => {if(e.key === "Enter"){sendGuess()}}} onChange={(e)=> setGuess(e.target.value)} value={guess} onBlur={(e) =>{e.target.focus()}} autoFocus placeholder='Guess...'></input>
          <br/>
          <button onClick={playAudio("Lool")}>Play song</button>
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
