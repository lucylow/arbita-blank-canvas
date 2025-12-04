// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AttestationAnchor
 * @notice Minimal on-chain attestation anchoring for NullAudit
 * @dev Stores merkle roots of audit evidence bundles with minimal gas cost
 */
contract AttestationAnchor {
    struct Anchor {
        bytes32 merkleRoot;      // Merkle root of evidence bundle
        uint256 ts;              // Block timestamp
        address signer;          // Attestor address
        string cid;              // IPFS CID of full evidence
        bool verified;           // Verification status
    }

    // Mapping: anchorId => Anchor
    mapping(bytes32 => Anchor) public anchors;
    
    // Mapping: signer => authorized
    mapping(address => bool) public authorizedSigners;
    
    // Owner address
    address public owner;
    
    // Minimum security score required (basis points, 10000 = 100%)
    uint256 public minSecurityScore = 7000; // 70%
    
    // Events
    event AnchorCreated(
        bytes32 indexed anchorId,
        bytes32 merkleRoot,
        uint256 ts,
        address indexed signer,
        string cid
    );
    
    event AnchorVerified(bytes32 indexed anchorId, address indexed verifier);
    event SignerAuthorized(address indexed signer, bool authorized);
    event MinSecurityScoreUpdated(uint256 oldScore, uint256 newScore);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedSigners[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedSigners[msg.sender] = true;
    }

    /**
     * @notice Create a new attestation anchor
     * @param anchorId Unique identifier for the anchor
     * @param merkleRoot Merkle root of the evidence bundle
     * @param cid IPFS CID of the full evidence manifest
     */
    function anchor(
        bytes32 anchorId,
        bytes32 merkleRoot,
        string calldata cid
    ) external onlyAuthorized {
        require(anchors[anchorId].ts == 0, "Anchor already exists");
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        
        anchors[anchorId] = Anchor({
            merkleRoot: merkleRoot,
            ts: block.timestamp,
            signer: msg.sender,
            cid: cid,
            verified: false
        });
        
        emit AnchorCreated(anchorId, merkleRoot, block.timestamp, msg.sender, cid);
    }

    /**
     * @notice Verify an attestation anchor
     * @param anchorId The anchor to verify
     * @param proof Merkle proof (for future implementation)
     */
    function verify(
        bytes32 anchorId,
        bytes32[] calldata proof
    ) external returns (bool) {
        Anchor storage a = anchors[anchorId];
        require(a.ts != 0, "Anchor does not exist");
        
        // Simple verification for now - can be enhanced with merkle proof verification
        a.verified = true;
        
        emit AnchorVerified(anchorId, msg.sender);
        return true;
    }

    /**
     * @notice Get anchor details
     * @param anchorId The anchor identifier
     */
    function getAnchor(bytes32 anchorId) 
        external 
        view 
        returns (Anchor memory) 
    {
        require(anchors[anchorId].ts != 0, "Anchor does not exist");
        return anchors[anchorId];
    }

    /**
     * @notice Check if anchor exists
     * @param anchorId The anchor identifier
     */
    function exists(bytes32 anchorId) external view returns (bool) {
        return anchors[anchorId].ts != 0;
    }

    /**
     * @notice Authorize or deauthorize a signer
     * @param signer Address to authorize/deauthorize
     * @param authorized Authorization status
     */
    function setAuthorizedSigner(address signer, bool authorized) 
        external 
        onlyOwner 
    {
        authorizedSigners[signer] = authorized;
        emit SignerAuthorized(signer, authorized);
    }

    /**
     * @notice Update minimum security score requirement
     * @param newScore New minimum score (basis points)
     */
    function setMinSecurityScore(uint256 newScore) external onlyOwner {
        require(newScore <= 10000, "Score too high");
        uint256 oldScore = minSecurityScore;
        minSecurityScore = newScore;
        emit MinSecurityScoreUpdated(oldScore, newScore);
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    /**
     * @notice Batch anchor creation for gas efficiency
     * @param anchorIds Array of anchor IDs
     * @param merkleRoots Array of merkle roots
     * @param cids Array of IPFS CIDs
     */
    function batchAnchor(
        bytes32[] calldata anchorIds,
        bytes32[] calldata merkleRoots,
        string[] calldata cids
    ) external onlyAuthorized {
        require(
            anchorIds.length == merkleRoots.length && 
            anchorIds.length == cids.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < anchorIds.length; i++) {
            require(anchors[anchorIds[i]].ts == 0, "Anchor exists");
            require(merkleRoots[i] != bytes32(0), "Invalid root");
            
            anchors[anchorIds[i]] = Anchor({
                merkleRoot: merkleRoots[i],
                ts: block.timestamp,
                signer: msg.sender,
                cid: cids[i],
                verified: false
            });
            
            emit AnchorCreated(
                anchorIds[i],
                merkleRoots[i],
                block.timestamp,
                msg.sender,
                cids[i]
            );
        }
    }
}
