import React, { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/students";

const emptyForm = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  mobile: "",
  email: "",
  course: "",
  year: "",
  college: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  guardianName: "",
  guardianMobile: "",
  guardianEmail: "",
};

const emptyEditForm = {
  name: "",
  email: "",
  course: "",
  city: "",
};

function DashboardMaind({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editId, setEditId] = useState(null);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isFinalSubmitted, setIsFinalSubmitted] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const steps = [
    "Personal Details",
    "Academic Details",
    "Address Details",
    "Guardian Details",
  ];

  // API helper
  async function apiRequest(url, options = {}) {
    let response;

    try {
      response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " +
            (localStorage.getItem("smsToken") ||
              sessionStorage.getItem("smsToken") ||
              ""),
          ...options.headers,
        },
      });
    } catch {
      throw new Error(
        "Backend is not connected. Please check that port 5000 is running.",
      );
    }

    const responseText = await response.text();

    console.log("Requested URL:", url);
    console.log("HTTP Status:", response.status);
    console.log("Actual Response:", responseText.slice(0, 300));

    if (!responseText.trim()) {
      if (!response.ok) {
        throw new Error(`Server error: HTTP ${response.status}`);
      }

      if (options.method === "DELETE") {
        return { message: "Student deleted successfully." };
      }

      throw new Error("Backend returned an empty response.");
    }

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        `API returned something other than JSON: ${responseText.slice(0, 120)}`,
      );
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  }

  // Load student records
  async function fetchStudents() {
    setLoading(true);

    try {
      const data = await apiRequest(API_URL);

      if (!Array.isArray(data)) {
        throw new Error("Student list was not found in the API response.");
      }

      setStudents(data);
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  // Automatically close success popup after 3 seconds
  useEffect(() => {
    if (!successPopup) return;

    const timer = setTimeout(() => {
      setSuccessPopup(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [successPopup]);

  // Form input handling
  function handleChange(event) {
    const { name } = event.target;
    let { value } = event.target;

    // Names: alphabetic characters and spaces only
    if (["firstName", "lastName", "guardianName"].includes(name)) {
      value = value.replace(/[^a-zA-Z ]/g, "");
    }

    // Mobile numbers: digits only, maximum 10 digits
    if (name === "mobile" || name === "guardianMobile") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    // PIN code: digits only, maximum 6 digits
    if (name === "pincode") {
      value = value.replace(/\D/g, "").slice(0, 6);
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => {
      const updated = { ...previous };
      delete updated[name];
      return updated;
    });

    setMessage("");
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Validate the current registration step
  function validateCurrentStep() {
    let requiredFields = [];

    if (step === 0) {
      requiredFields = [
        ["firstName", "Please enter your first name."],
        ["lastName", "Please enter your last name."],
        ["dob", "Please select your date of birth."],
        ["gender", "Please select your gender."],
        ["mobile", "Please enter your mobile number."],
        ["email", "Please enter your email address."],
      ];
    } else if (step === 1) {
      requiredFields = [
        ["course", "Please enter your course."],
        ["year", "Please select your academic year."],
        ["college", "Please enter your college name."],
      ];
    } else if (step === 2) {
      requiredFields = [
        ["address", "Please enter your full address."],
        ["city", "Please enter your city."],
        ["state", "Please enter your state."],
        ["pincode", "Please enter your PIN code."],
      ];
    } else {
      requiredFields = [
        ["guardianName", "Please enter your guardian name."],
        ["guardianMobile", "Please enter your guardian mobile number."],
        ["guardianEmail", "Please enter your guardian email."],
      ];
    }

    const errors = {};

    requiredFields.forEach(([key, errorText]) => {
      if (!String(form[key] || "").trim()) {
        errors[key] = errorText;
      }
    });

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (step === 0 && form.email && !emailPattern.test(form.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (step === 0 && form.mobile && form.mobile.length !== 10) {
      errors.mobile = "Mobile number must contain exactly 10 digits.";
    }

    if (step === 2 && form.pincode && form.pincode.length !== 6) {
      errors.pincode = "PIN code must contain exactly 6 digits.";
    }

    if (
      step === 3 &&
      form.guardianMobile &&
      form.guardianMobile.length !== 10
    ) {
      errors.guardianMobile =
        "Guardian mobile number must contain exactly 10 digits.";
    }

    if (
      step === 3 &&
      form.guardianEmail &&
      !emailPattern.test(form.guardianEmail.trim())
    ) {
      errors.guardianEmail = "Please enter a valid guardian email address.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleNext() {
    if (!validateCurrentStep()) {
      return;
    }

    // Guardian page par jaane se pehle errors hide karo.
    if (step === 2) {
      setIsFinalSubmitted(false);

      setFieldErrors((previous) => {
        const updated = { ...previous };

        delete updated.guardianName;
        delete updated.guardianMobile;
        delete updated.guardianEmail;

        return updated;
      });
    }

    setMessage("");
    setStep((previous) => Math.min(previous + 1, steps.length - 1));
  }

  function handlePrevious() {
    if (step === 3) {
      setIsFinalSubmitted(false);

      setFieldErrors((previous) => {
        const updated = { ...previous };
        delete updated.guardianName;
        delete updated.guardianMobile;
        delete updated.guardianEmail;
        return updated;
      });
    }

    setMessage("");
    setStep((previous) => Math.max(previous - 1, 0));
  }

  // Register student
  async function handleRegistration(event) {
    event.preventDefault();

    // Show Guardian Details validation only after clicking Register Student
    setIsFinalSubmitted(true);

    if (!validateCurrentStep()) return;
    if (submitting) return;

    const studentData = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      dob: form.dob || null,
      gender: form.gender,
      mobile: form.mobile,
      email: form.email.trim(),
      course: form.course,
      year: form.year,
      college: form.college,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      guardianName: form.guardianName.trim(),
      guardianMobile: form.guardianMobile,
      guardianEmail: form.guardianEmail.trim(),
    };

    setSubmitting(true);
    setMessage("");

    try {
      await apiRequest(API_URL, {
        method: "POST",
        body: JSON.stringify(studentData),
      });

      // Show popup only after the server successfully registers the student
      setSuccessPopup(true);

      setForm({ ...emptyForm });
      setStep(0);
      setFieldErrors({});
      setIsFinalSubmitted(false);
      setMessage("");

      await fetchStudents();
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Update student
  async function handleUpdate(event) {
    event.preventDefault();

    try {
      const data = await apiRequest(`${API_URL}/${editId}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });

      setEditId(null);
      setEditForm({ ...emptyEditForm });
      setMessage(data.message || "Student updated successfully!");

      await fetchStudents();
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  }

  // Fill edit form
  function handleEdit(student) {
    setEditId(student.id);

    setEditForm({
      name: student.name || "",
      email: student.email || "",
      course: student.course || "",
      city: student.city || "",
    });

    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Delete student
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      const data = await apiRequest(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (editId === id) {
        setEditId(null);
        setEditForm({ ...emptyEditForm });
      }

      setMessage(data.message || "Student deleted successfully!");
      await fetchStudents();
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ ...emptyEditForm });
    setMessage("");
  }

  return (
    <div className="container">
      {/* Success popup styles */}
      <style>{`
        .sms-popup-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.55);
          animation: smsOverlayIn 0.2s ease-out;
        }

        .sms-popup-window {
          width: 380px;
          max-width: 100%;
          padding: 32px 24px;
          border-radius: 18px;
          background: #ffffff;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: smsPopupIn 0.3s ease-out;
        }

        .sms-popup-check {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 72px;
          height: 72px;
          margin: 0 auto 16px;
          border-radius: 50%;
          color: #ffffff;
          background: #16a34a;
          font-size: 42px;
          font-weight: bold;
        }

        .sms-popup-window h2 {
          margin: 0 0 10px;
          color: #15803d;
          font-size: 25px;
        }

        .sms-popup-window p {
          margin: 0;
          color: #444444;
          font-size: 16px;
          line-height: 1.5;
        }

        @keyframes smsOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes smsPopupIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* Popup appears after successfull registration */}
      {successPopup && (
        <div className="sms-popup-overlay" role="presentation">
          <div className="sms-popup-window" role="status" aria-live="polite">
            <div className="sms-popup-check">✓</div>
            <h2>Success!</h2>
            <p>Student registered successfully!</p>
          </div>
        </div>
      )}

      <header className="header">
        <h1>Student Management System</h1>
        <p>Welcome To SMS!!!</p>

        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </header>

      {message && <div className="message">{message}</div>}

      <section className="form-section">
        <h2>{editId ? "Update Student" : "Student Registration"}</h2>

        {editId ? (
          <form onSubmit={handleUpdate}>
            <input
              name="name"
              placeholder="Student Name"
              value={editForm.name}
              onChange={handleEditChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={editForm.email}
              onChange={handleEditChange}
              required
            />

            <input
              name="course"
              placeholder="Course"
              value={editForm.course}
              onChange={handleEditChange}
              required
            />

            <input
              name="city"
              placeholder="City"
              value={editForm.city}
              onChange={handleEditChange}
              required
            />

            <button type="submit">Update Student</button>

            <button type="button" className="cancel-btn" onClick={cancelEdit}>
              Cancel
            </button>
          </form>
        ) : (
          <>
            <div className="step-progress">
              {steps.map((title, index) => (
                <div
                  key={title}
                  className={`step-item ${index <= step ? "active" : ""}`}
                >
                  <span className="step-number">{index + 1}</span>
                  <span className="step-title">{title}</span>
                </div>
              ))}
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${((step + 1) / steps.length) * 100}%`,
                }}
              />
            </div>

            <form onSubmit={handleRegistration} noValidate>
              {/* STEP 1: PERSONAL DETAILS */}
              {step === 0 && (
                <>
                  <div className="field-group">
                    <input
                      name="firstName"
                      placeholder="First Name"
                      value={form.firstName}
                      onChange={handleChange}
                    />
                    <small className="field-error-slot">
                      {fieldErrors.firstName || "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <input
                      name="lastName"
                      placeholder="Last Name"
                      value={form.lastName}
                      onChange={handleChange}
                    />
                    <small className="field-error-slot">
                      {fieldErrors.lastName || "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      max={new Date().toISOString().split("T")[0]}
                    />
                    <small className="field-error-slot">
                      {fieldErrors.dob || "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <small className="field-error-slot">
                      {fieldErrors.gender || "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <input
                      type="tel"
                      name="mobile"
                      placeholder="10-digit Mobile Number"
                      value={form.mobile}
                      onChange={handleChange}
                      inputMode="numeric"
                      maxLength={10}
                    />
                    <small className="field-error-slot">
                      {fieldErrors.mobile || "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={form.email}
                      onChange={handleChange}
                    />
                    <small className="field-error-slot">
                      {fieldErrors.email || "\u00A0"}
                    </small>
                  </div>
                </>
              )}

              {/* STEP 2: ACADEMIC DETAILS */}
              {step === 1 && (
                <>
                  <div className="field-group">
                    <input
                      name="course"
                      placeholder="Course (e.g. BCA)"
                      value={form.course}
                      onChange={handleChange}
                    />
                    <small className="field-error-slot">
                      {fieldErrors.course || "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <select
                      name="year"
                      value={form.year}
                      onChange={handleChange}
                    >
                      <option value="">Select Academic Year</option>
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <small className="field-error-slot">
                      {fieldErrors.year || "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <input
                      name="college"
                      placeholder="College Name"
                      value={form.college}
                      onChange={handleChange}
                    />
                    <small className="field-error-slot">
                      {fieldErrors.college || "\u00A0"}
                    </small>
                  </div>
                </>
              )}

              {/* STEP 3: ADDRESS DETAILS */}
              {step === 2 && (
                <>
                  <div className="field-group">
                    <textarea
                      className="registration-textarea"
                      name="address"
                      placeholder="Full Address"
                      value={form.address}
                      onChange={handleChange}
                    />
                    <small className="field-error-slot">
                      {fieldErrors.address || "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <input
                      name="city"
                      placeholder="City"
                      value={form.city}
                      onChange={handleChange}
                    />
                    <small className="field-error-slot">
                      {fieldErrors.city || "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <input
                      name="state"
                      placeholder="State"
                      value={form.state}
                      onChange={handleChange}
                    />
                    <small className="field-error-slot">
                      {fieldErrors.state || "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <input
                      type="text"
                      name="pincode"
                      placeholder="6-digit PIN Code"
                      value={form.pincode}
                      onChange={handleChange}
                      inputMode="numeric"
                      maxLength={6}
                    />
                    <small className="field-error-slot">
                      {fieldErrors.pincode || "\u00A0"}
                    </small>
                  </div>
                </>
              )}

              {/* STEP 4: GUARDIAN DETAILS */}
              {step === 3 && (
                <>
                  <div className="field-group">
                    <input
                      name="guardianName"
                      placeholder="Parent / Guardian Name"
                      value={form.guardianName}
                      onChange={handleChange}
                    />
                    <small className="field-error-slot">
                      {isFinalSubmitted
                        ? fieldErrors.guardianName || "\u00A0"
                        : "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <input
                      type="tel"
                      name="guardianMobile"
                      placeholder="Guardian 10-digit Mobile"
                      value={form.guardianMobile}
                      onChange={handleChange}
                      inputMode="numeric"
                      maxLength={10}
                    />
                    <small className="field-error-slot">
                      {isFinalSubmitted
                        ? fieldErrors.guardianMobile || "\u00A0"
                        : "\u00A0"}
                    </small>
                  </div>

                  <div className="field-group">
                    <input
                      type="email"
                      name="guardianEmail"
                      placeholder="Guardian Email"
                      value={form.guardianEmail}
                      onChange={handleChange}
                    />
                    <small className="field-error-slot">
                      {isFinalSubmitted
                        ? fieldErrors.guardianEmail || "\u00A0"
                        : "\u00A0"}
                    </small>
                  </div>
                </>
              )}

              <div className="step-buttons">
                {step > 0 && (
                  <button
                    type="button"
                    className="previous-btn"
                    onClick={handlePrevious}
                  >
                    Previous
                  </button>
                )}

                {step < steps.length - 1 ? (
                  <button type="button" onClick={handleNext}>
                    Next
                  </button>
                ) : (
                  <button type="submit" disabled={submitting}>
                    {submitting ? "Registering..." : "Register Student"}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </section>

      {/* STUDENT RECORDS */}
      <section className="table-section">
        <h2>Student Records</h2>

        <button type="button" className="refresh-btn" onClick={fetchStudents}>
          Refresh Records
        </button>

        {loading ? (
          <p>Loading students...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Academic Year</th>
                  <th>College</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>State</th>
                  <th>PIN Code</th>
                  <th>Guardian Name</th>
                  <th>Guardian Mobile</th>
                  <th>Guardian Email</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={18}>No students found</td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>{student.first_name || "-"}</td>
                      <td>{student.last_name || "-"}</td>
                      <td>
                        {student.dob ? String(student.dob).slice(0, 10) : "-"}
                      </td>
                      <td>{student.gender || "-"}</td>
                      <td>{student.mobile || "-"}</td>
                      <td>{student.email || "-"}</td>
                      <td>{student.course || "-"}</td>
                      <td>{student.study_year || "-"}</td>
                      <td>{student.college || "-"}</td>
                      <td>{student.address || "-"}</td>
                      <td>{student.city || "-"}</td>
                      <td>{student.state || "-"}</td>
                      <td>{student.pincode || "-"}</td>
                      <td>{student.guardian_name || "-"}</td>
                      <td>{student.guardian_mobile || "-"}</td>
                      <td>{student.guardian_email || "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(student)}
                        >
                          Edit
                        </button>{" "}
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(student.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardMaind;
