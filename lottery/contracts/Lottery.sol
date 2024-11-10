pragma solidity ^0.8.0;

contract Lottery {
    struct Participant {
        string username;
        address account;
    }

    Participant[] public participants;
    Participant public winner; // Store the winner here

    function enter(string memory _username) public payable {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(msg.value >= 0.01 ether, "Minimum 0.01 ETH required to enter");

        participants.push(Participant(_username, msg.sender));
    }

    function pickWinner() public {
        require(participants.length > 0, "No participants in the lottery");

        // Select a random winner
        uint randomIndex = uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender))) % participants.length;
        winner = participants[randomIndex]; // Store winner's details

        // Clear participants list for the next round
        delete participants;
    }

    // Function to get the winner's details
    function getWinner() public view returns (string memory, address) {
        return (winner.username, winner.account);
    }

    function getParticipants() public view returns (Participant[] memory) {
        return participants;
    }
}
