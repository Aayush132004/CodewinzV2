const Filter = ({ option, field, state }) => {
  const handleChange = (e) => {
    const value = e.target.value;
    state.setFilter({
      ...state.filter,
      [field]: value, // dynamically update only that key
    });
  };

  return (
    <select
      value={state.filter[field]}
      onChange={handleChange}
      className="bg-slate-800 text-white border border-slate-600 rounded-lg px-4 py-2"
    >
      {option.map((opt,i) => (
        <option key={i} value={opt.value}>
          {opt.data}
        </option>
      ))}
    </select>
  );
};

export default Filter;
