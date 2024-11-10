import React, { useEffect, useState } from 'react';
import Web3 from "web3";
import Lottery from "./Lottery.json"; // path to compiled contract ABI

const contractAddress = "0xd5c23d013f374b0d1d74e28db50a82bfd060e6ee"; // Replace with your contract's address

const LotteryApp = () => {
  const [web3, setWeb3] = useState(null);
  const [lotteryContract, setLotteryContract] = useState(null);
  const [username, setUsername] = useState('');
  const [participants, setParticipants] = useState([]);
  const [winner, setWinner] = useState(null); 
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const web3Instance = new Web3(window.ethereum);
          const contractInstance = new web3Instance.eth.Contract(Lottery.abi, contractAddress);
          setWeb3(web3Instance);
          setLotteryContract(contractInstance);
          await fetchParticipants(web3Instance, contractInstance);
          await fetchWinner(contractInstance);
        } catch (err) {
          console.error('User denied account access or another error occurred', err);
        }
      } else {
        alert('MetaMask is not installed. Please install it to use this dApp.');
      }
    };

    initWeb3();
  }, []);

  const enterLottery = async (username) => {
    if (!username) {
      console.error("Username is required to enter the lottery");
      return;
    }
    const accounts = await web3.eth.getAccounts();

    try {
      const transaction = {
        to: lotteryContract.options.address,
        gas: 2500000,
        gasPrice: await web3.eth.getGasPrice(),
        data: lotteryContract.methods.enter(username).encodeABI(),
        value: web3.utils.toWei("0.01", "ether"),
        from: accounts[0],
      };

      const receipt = await web3.eth.sendTransaction(transaction);
      console.log("Transaction successful:", receipt);
      await fetchParticipants(web3, lotteryContract);
    } catch (error) {
      console.error("Error entering the lottery:", error);
    }
  };

  const fetchParticipants = async (web3Instance, contractInstance) => {
    try {
      const participants = await contractInstance.methods.getParticipants().call();
      setParticipants(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const pickWinner = async () => {
    const accounts = await web3.eth.getAccounts();
    try {
      const transaction = {
        to: lotteryContract.options.address,
        gas: 2000000,
        gasPrice: await web3.eth.getGasPrice(),
        data: lotteryContract.methods.pickWinner().encodeABI(),
        from: accounts[0],
      };
      
      const receipt = await web3.eth.sendTransaction(transaction);
      console.log("Winner selected successfully:", receipt);
      await fetchWinner(lotteryContract);
    } catch (error) {
      console.error("Error selecting winner:", error);
    }
  };

  const fetchWinner = async (contractInstance) => {
    try {
      const winner = await contractInstance.methods.getWinner().call();
      if(winner[0] === "") {
        setWinner(null);
        return
      }
      setWinner({
        ...winner,
        amount: participants.length * 0.01
      });
    } catch (error) {
      console.error("Error fetching winner:", error);
    }
  };

  const handleEnterLottery = async () => {
    if (username.trim() === "") {
      setErrorMessage("Username is required to enter the lottery");
      return;
    }
    if (participants.find(participant => participant.username === username)) {
      setErrorMessage("Username already exists in the lottery");
      return;
    }
    await enterLottery(username);
    setUsername(''); 
  };

  const handlePickWinner = async () => {
    await pickWinner();
    setParticipants([]); 
  };

  const handleChange = (e) => {
    setErrorMessage(null);
    setUsername(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-fit min-w-[500px]">
        <h1 className="text-2xl font-bold text-center mb-6">Lottery Dapp</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Username:</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={handleChange}
          />
          {
            errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>
          }
        </div>
        <div className="flex justify-between mb-4 gap-4">
          <button
            onClick={handleEnterLottery}
            className="w-1/2 bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition"
          >
            Enter Lottery
          </button>
          <button
            onClick={handlePickWinner}
            className="w-1/2 bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition"
          >
            Pick Winner
          </button>
        </div>
        {
          winner ? (
            <div className="mt-6 p-4 border border-gray-300 rounded-md">
              <h2 className="text-xl font-semibold">Winner</h2>
              <p className="mt-2"><strong>Username:</strong> {winner[0]}</p>
              <p className="mt-1"><strong>Address:</strong> {winner[1]}</p>
              <p className="mt-1"><strong>Amount Won:</strong> {winner.amount} Eth</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mt-6">Participants</h2>
              <table className="min-w-full mt-2 bg-white border border-gray-300">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b">Username</th>
                    <th className="px-4 py-2 border-b">Account</th>
                    <th className="px-4 py-2 border-b">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{participant.username}</td>
                      <td className="px-4 py-2">{participant.account}</td>
                      <td className="px-4 py-2">0.01 Eth</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )
        }
      </div>
    </div>
  );
};

export default LotteryApp;
