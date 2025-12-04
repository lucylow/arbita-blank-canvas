// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Nullshot Core Contracts for NullAudit
 * - AttestationRegistry: On-chain attestation anchoring
 * - CommitmentVault: Stake management and slashing
 * - LaunchManager: Project lifecycle management
 * - FeeRouter: Fee distribution and treasury management
 */

// Note: In production, import from @openzeppelin/contracts
// For this skeleton, we define minimal interfaces

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title AttestationRegistry
 * @notice Registry for anchoring security attestations on-chain
 */
contract AttestationRegistry {
    struct Attestation {
        bytes32 artifactHash;
        address issuer;
        string metadataURI;
        uint256 timestamp;
    }

    mapping(bytes32 => Attestation) private attestations;
    mapping(address => bool) public attestors;
    address public owner;

    event AttestationRegistered(
        bytes32 indexed attestationId,
        bytes32 artifactHash,
        address indexed issuer,
        string metadataURI,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAttestor() {
        require(attestors[msg.sender], "Not attestor");
        _;
    }

    constructor() {
        owner = msg.sender;
        attestors[msg.sender] = true;
    }

    function addAttestor(address attestor) external onlyOwner {
        attestors[attestor] = true;
    }

    function registerAttestation(
        bytes32 artifactHash,
        string calldata metadataURI
    ) external onlyAttestor returns (bytes32 attestationId) {
        uint256 ts = block.timestamp;
        attestationId = keccak256(abi.encodePacked(artifactHash, msg.sender, ts));
        
        require(attestations[attestationId].timestamp == 0, "Already exists");

        attestations[attestationId] = Attestation({
            artifactHash: artifactHash,
            issuer: msg.sender,
            metadataURI: metadataURI,
            timestamp: ts
        });

        emit AttestationRegistered(attestationId, artifactHash, msg.sender, metadataURI, ts);
    }

    function getAttestation(bytes32 attestationId)
        external
        view
        returns (
            bytes32 artifactHash,
            address issuer,
            string memory metadataURI,
            uint256 timestamp
        )
    {
        Attestation storage a = attestations[attestationId];
        require(a.timestamp != 0, "Not found");
        return (a.artifactHash, a.issuer, a.metadataURI, a.timestamp);
    }
}

/**
 * @title CommitmentVault
 * @notice Vault for holding stakes with slashing capabilities
 */
contract CommitmentVault {
    IERC20 public immutable stakingToken;
    address public owner;
    mapping(address => bool) public managers;

    mapping(uint256 => mapping(address => uint256)) private stakes;
    mapping(uint256 => uint256) private totalStaked;
    mapping(uint256 => mapping(address => uint256)) private withdrawUnlockTs;

    uint256 public withdrawDelay = 1 days;

    event Deposited(uint256 indexed projectId, address indexed user, uint256 amount);
    event WithdrawRequested(uint256 indexed projectId, address indexed user, uint256 unlockTimestamp);
    event Withdrawn(uint256 indexed projectId, address indexed user, uint256 amount);
    event Slashed(uint256 indexed projectId, address indexed user, address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyManager() {
        require(managers[msg.sender], "Not manager");
        _;
    }

    constructor(address token) {
        require(token != address(0), "Zero token");
        stakingToken = IERC20(token);
        owner = msg.sender;
        managers[msg.sender] = true;
    }

    function addManager(address manager) external onlyOwner {
        managers[manager] = true;
    }

    function deposit(uint256 projectId, uint256 amount) external {
        require(amount > 0, "Zero deposit");
        stakes[projectId][msg.sender] += amount;
        totalStaked[projectId] += amount;
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Deposited(projectId, msg.sender, amount);
    }

    function requestWithdraw(uint256 projectId) external {
        uint256 s = stakes[projectId][msg.sender];
        require(s > 0, "No stake");
        withdrawUnlockTs[projectId][msg.sender] = block.timestamp + withdrawDelay;
        emit WithdrawRequested(projectId, msg.sender, withdrawUnlockTs[projectId][msg.sender]);
    }

    function withdraw(uint256 projectId) external {
        uint256 unlock = withdrawUnlockTs[projectId][msg.sender];
        require(unlock != 0 && unlock <= block.timestamp, "Locked");
        uint256 amount = stakes[projectId][msg.sender];
        require(amount > 0, "Nothing to withdraw");
        
        stakes[projectId][msg.sender] = 0;
        totalStaked[projectId] -= amount;
        withdrawUnlockTs[projectId][msg.sender] = 0;
        
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
        emit Withdrawn(projectId, msg.sender, amount);
    }

    function slash(
        uint256 projectId,
        address user,
        address to,
        uint256 amount
    ) external onlyManager {
        uint256 s = stakes[projectId][user];
        require(amount <= s, "Insufficient stake");
        
        stakes[projectId][user] -= amount;
        totalStaked[projectId] -= amount;
        
        require(stakingToken.transfer(to, amount), "Transfer failed");
        emit Slashed(projectId, user, to, amount);
    }

    function getStake(uint256 projectId, address user) external view returns (uint256) {
        return stakes[projectId][user];
    }
}

/**
 * @title LaunchManager
 * @notice Manages project lifecycle and security milestones
 */
contract LaunchManager {
    address public owner;
    AttestationRegistry public attestationRegistry;
    CommitmentVault public commitmentVault;

    enum ProjectStatus { Pending, Active, Completed, Failed }

    struct Project {
        uint256 id;
        address creator;
        string metadataURI;
        ProjectStatus status;
        uint256 createdAt;
        uint256 completedAt;
        bytes32[] attestations;
    }

    mapping(uint256 => Project) public projects;
    uint256 public projectCount;

    event ProjectCreated(uint256 indexed projectId, address indexed creator, string metadataURI);
    event ProjectStatusChanged(uint256 indexed projectId, ProjectStatus status);
    event AttestationAdded(uint256 indexed projectId, bytes32 attestationId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _attestationRegistry, address _commitmentVault) {
        owner = msg.sender;
        attestationRegistry = AttestationRegistry(_attestationRegistry);
        commitmentVault = CommitmentVault(_commitmentVault);
    }

    function createProject(string calldata metadataURI) external returns (uint256 projectId) {
        projectId = ++projectCount;
        
        projects[projectId] = Project({
            id: projectId,
            creator: msg.sender,
            metadataURI: metadataURI,
            status: ProjectStatus.Pending,
            createdAt: block.timestamp,
            completedAt: 0,
            attestations: new bytes32[](0)
        });

        emit ProjectCreated(projectId, msg.sender, metadataURI);
    }

    function addAttestation(uint256 projectId, bytes32 attestationId) external {
        Project storage project = projects[projectId];
        require(project.id != 0, "Project not found");
        require(msg.sender == project.creator || msg.sender == owner, "Not authorized");
        
        project.attestations.push(attestationId);
        emit AttestationAdded(projectId, attestationId);
    }

    function updateProjectStatus(uint256 projectId, ProjectStatus status) external onlyOwner {
        Project storage project = projects[projectId];
        require(project.id != 0, "Project not found");
        
        project.status = status;
        if (status == ProjectStatus.Completed || status == ProjectStatus.Failed) {
            project.completedAt = block.timestamp;
        }
        
        emit ProjectStatusChanged(projectId, status);
    }

    function getProject(uint256 projectId) external view returns (Project memory) {
        return projects[projectId];
    }
}

/**
 * @title FeeRouter
 * @notice Routes fees to treasury and stakeholders
 */
contract FeeRouter {
    address public owner;
    address public treasury;
    
    mapping(address => uint256) public feeShares; // basis points (10000 = 100%)
    address[] public recipients;

    event FeeDistributed(address indexed token, uint256 totalAmount);
    event RecipientAdded(address indexed recipient, uint256 share);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury;
    }

    function addRecipient(address recipient, uint256 share) external onlyOwner {
        require(share <= 10000, "Invalid share");
        feeShares[recipient] = share;
        recipients.push(recipient);
        emit RecipientAdded(recipient, share);
    }

    function distributeFees(address token) external {
        IERC20 feeToken = IERC20(token);
        uint256 balance = feeToken.balanceOf(address(this));
        require(balance > 0, "No fees to distribute");

        uint256 distributed = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 share = feeShares[recipient];
            if (share > 0) {
                uint256 amount = (balance * share) / 10000;
                require(feeToken.transfer(recipient, amount), "Transfer failed");
                distributed += amount;
            }
        }

        // Send remainder to treasury
        uint256 remainder = balance - distributed;
        if (remainder > 0) {
            require(feeToken.transfer(treasury, remainder), "Transfer failed");
        }

        emit FeeDistributed(token, balance);
    }

    receive() external payable {}
}
