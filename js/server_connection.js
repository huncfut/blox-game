const connect = () => {
  ws.send(JSON.stringify({
    opcode: 'spawn',
    data: {
      nick: "xd"
    }
  }))
}
