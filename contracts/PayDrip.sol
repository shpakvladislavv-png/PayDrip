// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title PayDrip (UUPS Upgradeable)
 * @notice Minimal example for streaming-like 'drip' balances that accrue linearly over time.
 *         Educational skeleton, not audited.
 */
contract PayDrip is Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable {
    struct Stream {
        uint128 ratePerSecond; // wei per second
        uint64 lastUpdate;
        uint64 _reserved;
        uint256 accrued;
    }

    mapping(address => Stream) public streams;

    event StreamUpdated(address indexed recipient, uint256 ratePerSecond);
    event Withdrawn(address indexed recipient, uint256 amount);
    event Funded(address indexed from, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function setRate(address recipient, uint128 ratePerSecond) external onlyOwner whenNotPaused {
        _updateAccrual(recipient);
        streams[recipient].ratePerSecond = ratePerSecond;
        emit StreamUpdated(recipient, ratePerSecond);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function withdraw(uint256 amount) external whenNotPaused {
        _updateAccrual(msg.sender);
        require(streams[msg.sender].accrued >= amount, "Insufficient accrued");
        streams[msg.sender].accrued -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function withdrawAll() external whenNotPaused {
        _updateAccrual(msg.sender);
        uint256 amount = streams[msg.sender].accrued;
        streams[msg.sender].accrued = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    receive() external payable { emit Funded(msg.sender, msg.value); }
    function fund() external payable { emit Funded(msg.sender, msg.value); }

    function previewAccrued(address recipient) public view returns (uint256) {
        Stream memory s = streams[recipient];
        uint256 extra = uint256(s.ratePerSecond) * (block.timestamp - s.lastUpdate);
        return s.accrued + extra;
    }

    function _updateAccrual(address recipient) internal {
        Stream storage s = streams[recipient];
        uint256 dt = block.timestamp - s.lastUpdate;
        if (dt > 0) {
            s.accrued += uint256(s.ratePerSecond) * dt;
            s.lastUpdate = uint64(block.timestamp);
        } else if (s.lastUpdate == 0) {
            s.lastUpdate = uint64(block.timestamp);
        }
    }
}
