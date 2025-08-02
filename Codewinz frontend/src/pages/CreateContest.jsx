// src/pages/CreateContest.jsx

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axiosClient from '../../utils/axiosClient';

const CreateContest = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [allProblems, setAllProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]); // Problems chosen for this contest

  useEffect(() => {
    // Fetch all available problems when the component mounts
    const fetchProblems = async () => {
      try {
        const problems = await axiosClient.get("/problem/getAllProblemwithoutlimit");
        console.log("soln",problems);
        setAllProblems(problems.data.allProblems);
      } catch (error) {
        console.error('Error fetching problems:', error);
        // Handle error (e.g., show error message to user)
      }
    };
    fetchProblems();
  }, []);

  // Handler to add a problem to the selected list
  const handleAddProblem = (problemToAdd) => {
    // Check if the problem is already selected
    if (!selectedProblems.some(p => p._id === problemToAdd._id)) {
      setSelectedProblems(prev => [...prev, problemToAdd]);
    }
  };

  // Handler to remove a problem from the selected list
  const handleRemoveProblem = (problemIdToRemove) => {
    setSelectedProblems(prev => prev.filter(p => p._id !== problemIdToRemove));
  };

  // onSubmit function for react-hook-form
  const onSubmit = async (data) => {
    if (selectedProblems.length === 0) {
      alert('Please add at least one problem to the contest.');
      return;
    }

    // Format dates to ISO 8601 UTC strings (as discussed)
    const formattedStartDate = new Date(data.startDate).toISOString();
    const formattedEndDate = new Date(data.endDate).toISOString();

    // Prepare contest data for API
    const contestData = {
      title: data.contestTitle,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      problems: selectedProblems.map(p => p._id), // Send only problem IDs
      // You might add creatorId here, e.g., from an auth context
      // creatorId: 'your_authenticated_user_id',
    };

    try {
      const response = await axiosClient.post("/contest/create",contestData);
      if (response) {
        alert('Contest created successfully!');
        // Optionally, clear form or redirect user
        // reset(); // from useForm - to reset form fields
        // setSelectedProblems([]); // Clear selected problem
      }
    } catch (error) {
      console.error('Error creating contest:', error);
      alert('An error occurred during contest creation.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Create New Contest</h2>
      <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
        {/* Contest Title */}
        <div style={styles.formGroup}>
          <label htmlFor="contestTitle" style={styles.label}>Contest Title:</label>
          <input
            id="contestTitle"
            type="text"
            {...register('contestTitle', { required: 'Contest title is required' })}
            style={styles.input}
          />
          {errors.contestTitle && <p style={styles.error}>{errors.contestTitle.message}</p>}
        </div>

        {/* Start Date */}
        <div style={styles.formGroup}>
          <label htmlFor="startDate" style={styles.label}>Start Date & Time:</label>
          <input
            id="startDate"
            type="datetime-local" // HTML5 input for local date and time
            {...register('startDate', { required: 'Start date is required' })}
            style={styles.input}
          />
          {errors.startDate && <p style={styles.error}>{errors.startDate.message}</p>}
        </div>

        {/* End Date */}
        <div style={styles.formGroup}>
          <label htmlFor="endDate" style={styles.label}>End Date & Time:</label>
          <input
            id="endDate"
            type="datetime-local"
            {...register('endDate', { required: 'End date is required' })}
            style={styles.input}
          />
          {errors.endDate && <p style={styles.error}>{errors.endDate.message}</p>}
        </div>

        {/* Problems Selection Area */}
        <div style={styles.problemsSection}>
          {/* All Available Problems List */}
          <div style={styles.problemListContainer}>
            <h3>All Available Problems</h3>
            <div style={styles.problemList}>
              {allProblems.length === 0 ? (
                <p>Loading problems...</p>
              ) : (
                allProblems.map(problem => (
                  <div key={problem._id} style={styles.problemListItem}>
                    <span>{problem.title} ({problem.difficulty}) ({problem.tags})</span>
                    <button type="button" onClick={() => handleAddProblem(problem)} style={styles.addButton}>
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Problems Display */}
          <div style={styles.problemListContainer}>
            <h3>Problems in Contest ({selectedProblems.length})</h3>
            <div style={styles.problemList}>
              {selectedProblems.length === 0 ? (
                <p>No problems added yet.</p>
              ) : (
                selectedProblems.map(problem => (
                  <div key={problem._id} style={styles.problemListItem}>
                    <span>{problem.title} ({problem.difficulty})</span>
                    <button type="button" onClick={() => handleRemoveProblem(problem._id)} style={styles.removeButton}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Form Submission */}
        <button type="submit" style={styles.submitButton}>Create Contest</button>
      </form>
    </div>
  );
};

// Basic inline styles for a "good looking" (structured) appearance
const styles = {
  container: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    fontFamily: 'Arial, sans-serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    marginBottom: '10px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  error: {  
    color: 'red',
    fontSize: '0.85em',
    marginTop: '5px',
  },
  problemsSection: {
    display: 'flex',
    gap: '20px',
    marginTop: '20px',
  },
  problemListContainer: {
    flex: 1,
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
  },
  problemList: {
    maxHeight: '300px',
    overflowY: 'auto',
    borderTop: '1px solid #eee',
    marginTop: '10px',
    paddingTop: '10px',
  },
  problemListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px dashed #eee',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9em',
    transition: 'background-color 0.2s',
  },
  removeButton: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9em',
    transition: 'background-color 0.2s',
  },
  submitButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1.1em',
    fontWeight: 'bold',
    marginTop: '20px',
    transition: 'background-color 0.2s',
  }
};


export default CreateContest;