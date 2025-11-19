const Test = () => {
  console.log("TEST COMPONENT RENDERING!!!");
  return (
    <div style={{ 
      color: 'black', 
      padding: '20px',
      backgroundColor: 'yellow',
      fontSize: '32px',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      zIndex: 9999
    }}>
      Test Component Works! If you see this, React is working!
    </div>
  );
};

export default Test;
