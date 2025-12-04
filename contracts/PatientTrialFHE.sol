// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PatientTrialFHE is SepoliaConfig {

    struct EncryptedPreference {
        uint256 id;
        euint32 encryptedTrialAspect;
        euint32 encryptedImportance;
        euint32 encryptedComment;
        uint256 timestamp;
    }

    struct DecryptedPreference {
        string trialAspect;
        string importance;
        string comment;
        bool isRevealed;
    }

    uint256 public preferenceCount;
    mapping(uint256 => EncryptedPreference) public encryptedPreferences;
    mapping(uint256 => DecryptedPreference) public decryptedPreferences;

    mapping(string => euint32) private encryptedAspectCount;
    string[] private trialAspectList;

    mapping(uint256 => uint256) private requestToPreferenceId;

    event PreferenceSubmitted(uint256 indexed id, uint256 timestamp);
    event DecryptionRequested(uint256 indexed id);
    event PreferenceDecrypted(uint256 indexed id);

    modifier onlyParticipant(uint256 preferenceId) {
        _;
    }

    function submitEncryptedPreference(
        euint32 encryptedTrialAspect,
        euint32 encryptedImportance,
        euint32 encryptedComment
    ) public {
        preferenceCount += 1;
        uint256 newId = preferenceCount;

        encryptedPreferences[newId] = EncryptedPreference({
            id: newId,
            encryptedTrialAspect: encryptedTrialAspect,
            encryptedImportance: encryptedImportance,
            encryptedComment: encryptedComment,
            timestamp: block.timestamp
        });

        decryptedPreferences[newId] = DecryptedPreference({
            trialAspect: "",
            importance: "",
            comment: "",
            isRevealed: false
        });

        emit PreferenceSubmitted(newId, block.timestamp);
    }

    function requestPreferenceDecryption(uint256 preferenceId) public onlyParticipant(preferenceId) {
        EncryptedPreference storage pref = encryptedPreferences[preferenceId];
        require(!decryptedPreferences[preferenceId].isRevealed, "Already decrypted");

        bytes32[] memory ciphertexts = new bytes32[](3);
        ciphertexts[0] = FHE.toBytes32(pref.encryptedTrialAspect);
        ciphertexts[1] = FHE.toBytes32(pref.encryptedImportance);
        ciphertexts[2] = FHE.toBytes32(pref.encryptedComment);

        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptPreference.selector);
        requestToPreferenceId[reqId] = preferenceId;

        emit DecryptionRequested(preferenceId);
    }

    function decryptPreference(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory proof
    ) public {
        uint256 preferenceId = requestToPreferenceId[requestId];
        require(preferenceId != 0, "Invalid request");

        EncryptedPreference storage ePref = encryptedPreferences[preferenceId];
        DecryptedPreference storage dPref = decryptedPreferences[preferenceId];
        require(!dPref.isRevealed, "Already decrypted");

        FHE.checkSignatures(requestId, cleartexts, proof);

        string[] memory results = abi.decode(cleartexts, (string[]));

        dPref.trialAspect = results[0];
        dPref.importance = results[1];
        dPref.comment = results[2];
        dPref.isRevealed = true;

        if (!FHE.isInitialized(encryptedAspectCount[dPref.trialAspect])) {
            encryptedAspectCount[dPref.trialAspect] = FHE.asEuint32(0);
            trialAspectList.push(dPref.trialAspect);
        }
        encryptedAspectCount[dPref.trialAspect] = FHE.add(encryptedAspectCount[dPref.trialAspect], FHE.asEuint32(1));

        emit PreferenceDecrypted(preferenceId);
    }

    function getDecryptedPreference(uint256 preferenceId) public view returns (
        string memory trialAspect,
        string memory importance,
        string memory comment,
        bool isRevealed
    ) {
        DecryptedPreference storage r = decryptedPreferences[preferenceId];
        return (r.trialAspect, r.importance, r.comment, r.isRevealed);
    }

    function getEncryptedAspectCount(string memory trialAspect) public view returns (euint32) {
        return encryptedAspectCount[trialAspect];
    }

    function requestAspectCountDecryption(string memory trialAspect) public {
        euint32 count = encryptedAspectCount[trialAspect];
        require(FHE.isInitialized(count), "Aspect not found");

        bytes32[] memory ciphertexts = new bytes32[](1);
        ciphertexts[0] = FHE.toBytes32(count);

        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptAspectCount.selector);
        requestToPreferenceId[reqId] = bytes32ToUint(keccak256(abi.encodePacked(trialAspect)));
    }

    function decryptAspectCount(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory proof
    ) public {
        uint256 aspectHash = requestToPreferenceId[requestId];
        string memory trialAspect = getAspectFromHash(aspectHash);

        FHE.checkSignatures(requestId, cleartexts, proof);

        uint32 count = abi.decode(cleartexts, (uint32));
    }

    function bytes32ToUint(bytes32 b) private pure returns (uint256) {
        return uint256(b);
    }

    function getAspectFromHash(uint256 hash) private view returns (string memory) {
        for (uint i = 0; i < trialAspectList.length; i++) {
            if (bytes32ToUint(keccak256(abi.encodePacked(trialAspectList[i]))) == hash) {
                return trialAspectList[i];
            }
        }
        revert("Aspect not found");
    }
}
