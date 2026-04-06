import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function Versions() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [versions, setVersions] = useState([]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/versions/${projectId}`,
        {
          headers: { Authorization: token },
        }
      );
      setVersions(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddVersion = async () => {
    if (!description) return alert("Enter description");

    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("description", description);
      formData.append("file", file);

      await axios.post(
        "http://localhost:5000/api/versions",
        formData,
        {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setDescription("");
      setFile(null);
      setShowForm(false);
      fetchVersions();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Section */}
      <div style={styles.topRow}>
        <h3 style={styles.heading}>Project Versions</h3>

        {role === "user" ? (
          <button
            style={styles.addBtn}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Version"}
          </button>
        ) : null}
      </div>

      {/* Add Version Form */}
      {showForm && (
        <div style={styles.form}>
          <input
            style={styles.input}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button style={styles.submitBtn} onClick={handleAddVersion}>
            Add Version
          </button>
        </div>
      )}

      {/* Versions List */}
      {versions.length === 0 ? (
        <p>No versions yet</p>
      ) : (
        <div style={styles.grid}>
          {versions.map((version) => (
            <div key={version._id} style={styles.card}>
              <p style={styles.desc}>{version.description}</p>

              <p style={styles.date}>
                Added:{" "}
                {new Date(version.createdAt).toLocaleDateString()}
              </p>

              {/* File Link */}
              {version.file && (
                <a
                  href={`http://localhost:5000/uploads/${version.file}`}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.fileLink}
                >
                  📎 View Uploaded File
                </a>
              )}

              <br />

              {/* Feedback Button */}
              <button
                style={styles.feedbackBtn}
                onClick={() =>
                  navigate(`/feedback/${version._id}`)
                }
              >
                💬 View Feedback →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  heading: {
    margin: 0,
  },
  addBtn: {
    padding: "8px 16px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  form: {
    marginBottom: "20px",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
  },
  input: {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
  },
  submitBtn: {
    padding: "8px 16px",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
  },
  grid: {
    display: "grid",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    borderLeft: "4px solid #4f46e5",
  },
  desc: {
    marginBottom: "10px",
  },
  date: {
    fontSize: "12px",
    color: "#777",
  },
  fileLink: {
    display: "inline-block",
    marginTop: "10px",
    color: "#4f46e5",
  },
  feedbackBtn: {
    marginTop: "10px",
    padding: "6px 12px",
    backgroundColor: "#eef2ff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default Versions;