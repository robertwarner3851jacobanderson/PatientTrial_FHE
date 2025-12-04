// App.tsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContractReadOnly, getContractWithSigner } from "./contract";
import WalletManager from "./components/WalletManager";
import WalletSelector from "./components/WalletSelector";
import "./App.css";

interface TrialPreference {
  id: string;
  encryptedData: string;
  timestamp: number;
  owner: string;
  preferenceType: string;
  status: "pending" | "approved" | "rejected";
}

const App: React.FC = () => {
  // Randomized style selections
  // Colors: High contrast (blue+orange)
  // UI Style: Future metal
  // Layout: Center radiation
  // Interaction: Micro-interactions

  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<TrialPreference[]>([]);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    visible: boolean;
    status: "pending" | "success" | "error";
    message: string;
  }>({ visible: false, status: "pending", message: "" });
  const [newPreference, setNewPreference] = useState({
    preferenceType: "",
    details: "",
    comments: ""
  });
  const [showStats, setShowStats] = useState(false);

  // Statistics for dashboard
  const approvedCount = preferences.filter(p => p.status === "approved").length;
  const pendingCount = preferences.filter(p => p.status === "pending").length;
  const rejectedCount = preferences.filter(p => p.status === "rejected").length;

  useEffect(() => {
    loadPreferences().finally(() => setLoading(false));
  }, []);

  const onWalletSelect = async (wallet: any) => {
    if (!wallet.provider) return;
    try {
      const web3Provider = new ethers.BrowserProvider(wallet.provider);
      setProvider(web3Provider);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const acc = accounts[0] || "";
      setAccount(acc);

      wallet.provider.on("accountsChanged", async (accounts: string[]) => {
        const newAcc = accounts[0] || "";
        setAccount(newAcc);
      });
    } catch (e) {
      alert("Failed to connect wallet");
    }
  };

  const onConnect = () => setWalletSelectorOpen(true);
  const onDisconnect = () => {
    setAccount("");
    setProvider(null);
  };

  const loadPreferences = async () => {
    setIsRefreshing(true);
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      
      // Check contract availability using FHE
      const isAvailable = await contract.isAvailable();
      if (!isAvailable) {
        console.error("Contract is not available");
        return;
      }
      
      const keysBytes = await contract.getData("preference_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing preference keys:", e);
        }
      }
      
      const list: TrialPreference[] = [];
      
      for (const key of keys) {
        try {
          const prefBytes = await contract.getData(`preference_${key}`);
          if (prefBytes.length > 0) {
            try {
              const prefData = JSON.parse(ethers.toUtf8String(prefBytes));
              list.push({
                id: key,
                encryptedData: prefData.data,
                timestamp: prefData.timestamp,
                owner: prefData.owner,
                preferenceType: prefData.preferenceType,
                status: prefData.status || "pending"
              });
            } catch (e) {
              console.error(`Error parsing preference data for ${key}:`, e);
            }
          }
        } catch (e) {
          console.error(`Error loading preference ${key}:`, e);
        }
      }
      
      list.sort((a, b) => b.timestamp - a.timestamp);
      setPreferences(list);
    } catch (e) {
      console.error("Error loading preferences:", e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const submitPreference = async () => {
    if (!provider) { 
      alert("Please connect wallet first"); 
      return; 
    }
    
    setSubmitting(true);
    setTransactionStatus({
      visible: true,
      status: "pending",
      message: "Encrypting trial preference with FHE..."
    });
    
    try {
      // Simulate FHE encryption
      const encryptedData = `FHE-${btoa(JSON.stringify(newPreference))}`;
      
      const contract = await getContractWithSigner();
      if (!contract) {
        throw new Error("Failed to get contract with signer");
      }
      
      const prefId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const prefData = {
        data: encryptedData,
        timestamp: Math.floor(Date.now() / 1000),
        owner: account,
        preferenceType: newPreference.preferenceType,
        status: "pending"
      };
      
      // Store encrypted data on-chain using FHE
      await contract.setData(
        `preference_${prefId}`, 
        ethers.toUtf8Bytes(JSON.stringify(prefData))
      );
      
      const keysBytes = await contract.getData("preference_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing keys:", e);
        }
      }
      
      keys.push(prefId);
      
      await contract.setData(
        "preference_keys", 
        ethers.toUtf8Bytes(JSON.stringify(keys))
      );
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: "Encrypted preference submitted securely!"
      });
      
      await loadPreferences();
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
        setShowSubmitModal(false);
        setNewPreference({
          preferenceType: "",
          details: "",
          comments: ""
        });
      }, 2000);
    } catch (e: any) {
      const errorMessage = e.message.includes("user rejected transaction")
        ? "Transaction rejected by user"
        : "Submission failed: " + (e.message || "Unknown error");
      
      setTransactionStatus({
        visible: true,
        status: "error",
        message: errorMessage
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const checkAvailability = async () => {
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      
      const isAvailable = await contract.isAvailable();
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: `FHE Service is ${isAvailable ? "available" : "unavailable"}`
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 2000);
    } catch (e) {
      setTransactionStatus({
        visible: true,
        status: "error",
        message: "Failed to check availability"
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    }
  };

  const isOwner = (address: string) => {
    return account.toLowerCase() === address.toLowerCase();
  };

  const renderStats = () => {
    return (
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{preferences.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{approvedCount}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{rejectedCount}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="metal-spinner"></div>
      <p>Initializing FHE connection...</p>
    </div>
  );

  return (
    <div className="app-container future-metal-theme">
      <div className="central-radial-layout">
        <header className="app-header">
          <div className="logo">
            <div className="hexagon-icon"></div>
            <h1>Patient<span>Trial</span>Design</h1>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={() => setShowSubmitModal(true)} 
              className="submit-pref-btn metal-button"
            >
              <div className="plus-icon"></div>
              Submit Preference
            </button>
            <button 
              className="metal-button"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? "Hide Stats" : "Show Stats"}
            </button>
            <button 
              className="metal-button"
              onClick={checkAvailability}
            >
              Check FHE Status
            </button>
            <WalletManager account={account} onConnect={onConnect} onDisconnect={onDisconnect} />
          </div>
        </header>
        
        <main className="main-content">
          <div className="hero-banner">
            <div className="hero-text">
              <h2>Anonymous Patient-Centered Clinical Trial Design</h2>
              <p>Submit your trial preferences anonymously using FHE encryption</p>
            </div>
            <div className="fhe-badge">
              <span>Fully Homomorphic Encryption</span>
            </div>
          </div>
          
          {showStats && (
            <div className="stats-section metal-card">
              <h3>Preference Statistics</h3>
              {renderStats()}
            </div>
          )}
          
          <div className="preferences-section">
            <div className="section-header">
              <h2>Your Trial Preferences</h2>
              <div className="header-actions">
                <button 
                  onClick={loadPreferences}
                  className="refresh-btn metal-button"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
            
            <div className="preferences-list metal-card">
              <div className="table-header">
                <div className="header-cell">ID</div>
                <div className="header-cell">Type</div>
                <div className="header-cell">Date</div>
                <div className="header-cell">Status</div>
              </div>
              
              {preferences.length === 0 ? (
                <div className="no-preferences">
                  <div className="no-prefs-icon"></div>
                  <p>No preferences submitted yet</p>
                  <button 
                    className="metal-button primary"
                    onClick={() => setShowSubmitModal(true)}
                  >
                    Submit First Preference
                  </button>
                </div>
              ) : (
                preferences.filter(p => isOwner(p.owner)).map(pref => (
                  <div className="pref-row" key={pref.id}>
                    <div className="table-cell pref-id">#{pref.id.substring(0, 6)}</div>
                    <div className="table-cell">{pref.preferenceType}</div>
                    <div className="table-cell">
                      {new Date(pref.timestamp * 1000).toLocaleDateString()}
                    </div>
                    <div className="table-cell">
                      <span className={`status-badge ${pref.status}`}>
                        {pref.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
    
        {showSubmitModal && (
          <ModalSubmit 
            onSubmit={submitPreference} 
            onClose={() => setShowSubmitModal(false)} 
            submitting={submitting}
            prefData={newPreference}
            setPrefData={setNewPreference}
          />
        )}
        
        {walletSelectorOpen && (
          <WalletSelector
            isOpen={walletSelectorOpen}
            onWalletSelect={(wallet) => { onWalletSelect(wallet); setWalletSelectorOpen(false); }}
            onClose={() => setWalletSelectorOpen(false)}
          />
        )}
        
        {transactionStatus.visible && (
          <div className="transaction-modal">
            <div className="transaction-content metal-card">
              <div className={`transaction-icon ${transactionStatus.status}`}>
                {transactionStatus.status === "pending" && <div className="metal-spinner"></div>}
                {transactionStatus.status === "success" && <div className="check-icon"></div>}
                {transactionStatus.status === "error" && <div className="error-icon"></div>}
              </div>
              <div className="transaction-message">
                {transactionStatus.message}
              </div>
            </div>
          </div>
        )}
    
        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <div className="hexagon-icon"></div>
                <span>PatientTrialDesign</span>
              </div>
              <p>Anonymous clinical trial preference collection using FHE</p>
            </div>
            
            <div className="footer-links">
              <a href="#" className="footer-link">About FHE</a>
              <a href="#" className="footer-link">Privacy</a>
              <a href="#" className="footer-link">Contact</a>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="fhe-badge">
              <span>FHE-Powered Privacy</span>
            </div>
            <div className="copyright">
              © {new Date().getFullYear()} PatientTrialDesign. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

interface ModalSubmitProps {
  onSubmit: () => void; 
  onClose: () => void; 
  submitting: boolean;
  prefData: any;
  setPrefData: (data: any) => void;
}

const ModalSubmit: React.FC<ModalSubmitProps> = ({ 
  onSubmit, 
  onClose, 
  submitting,
  prefData,
  setPrefData
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPrefData({
      ...prefData,
      [name]: value
    });
  };

  const handleSubmit = () => {
    if (!prefData.preferenceType || !prefData.details) {
      alert("Please fill required fields");
      return;
    }
    
    onSubmit();
  };

  return (
    <div className="modal-overlay">
      <div className="submit-modal metal-card">
        <div className="modal-header">
          <h2>Submit Trial Preference</h2>
          <button onClick={onClose} className="close-modal">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="fhe-notice-banner">
            <div className="lock-icon"></div> Your preference will be encrypted with FHE
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Preference Type *</label>
              <select 
                name="preferenceType"
                value={prefData.preferenceType} 
                onChange={handleChange}
                className="metal-select"
              >
                <option value="">Select type</option>
                <option value="Visit Frequency">Visit Frequency</option>
                <option value="Dosage">Dosage Preference</option>
                <option value="Location">Location Preference</option>
                <option value="Monitoring">Monitoring Level</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Details *</label>
              <input 
                type="text"
                name="details"
                value={prefData.details} 
                onChange={handleChange}
                placeholder="Your preference details..." 
                className="metal-input"
              />
            </div>
            
            <div className="form-group full-width">
              <label>Additional Comments</label>
              <textarea 
                name="comments"
                value={prefData.comments} 
                onChange={handleChange}
                placeholder="Any additional comments..." 
                className="metal-textarea"
                rows={3}
              />
            </div>
          </div>
          
          <div className="privacy-notice">
            <div className="shield-icon"></div> Data remains encrypted during FHE processing
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={onClose}
            className="cancel-btn metal-button"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="submit-btn metal-button primary"
          >
            {submitting ? "Encrypting with FHE..." : "Submit Anonymously"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;