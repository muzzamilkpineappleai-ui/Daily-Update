import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import CalendarIcon from '../../../assets/icons/Calendar.png';
import FilterIcon from '../../../assets/icons/Filter.png';
import { getDropdownOptions } from '../../../integration/studentAPI';
import '../../../Styles/Students-css/StudentFormStepper/Step1PersonalInfo.css';
import FormLabel from '../../../Components/FormLabel';

// Regex: Only letters, spaces, hyphens, and apostrophes allowed
const NAME_REGEX = /^[A-Za-z\s\-']*$/;

const Step1PersonalInfo = ({ formData, onChange, errors, onImageChange }) => {
  const [roles, setRoles] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const datePickerRef = useRef(null);

  // Sync date_of_birth from formData
  useEffect(() => {
    if (formData.date_of_birth) {
      const date = new Date(formData.date_of_birth);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      } else {
        setSelectedDate(null);
      }
    } else {
      setSelectedDate(null);
    }
  }, [formData.date_of_birth]);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const fetchedRoles = await getDropdownOptions('roles');
        setRoles(fetchedRoles);
      } catch (error) {
        console.error('Failed to fetch roles:', error.message);
      }
    };
    fetchRoles();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  // Restrict name fields to only allowed characters
  const handleNameChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || NAME_REGEX.test(value)) {
      onChange({ [name]: value });
    }
    // If invalid char is typed → do nothing (character won't appear)
  };

  // Helper to check if name has invalid characters (for error display)
  const isNameInvalid = (value) => {
    return value && !NAME_REGEX.test(value);
  };

  // Masked Date Input (unchanged)
  const MaskedDateInput = React.forwardRef(({ value, onClick, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
      if (value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          const yyyy = date.getFullYear();
          setDisplayValue(`${mm}/${dd}/${yyyy}`);
        }
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const formatInput = (raw) => {
      const digits = raw.replace(/\D/g, '').slice(0, 8);
      let formatted = '';
      if (digits.length >= 1) formatted += digits.slice(0, 2);
      if (digits.length >= 3) formatted += '/' + digits.slice(2, 4);
      if (digits.length >= 5) formatted += '/' + digits.slice(4, 8);
      return { digits, formatted };
    };

    const handleChange = (e) => {
      const { digits, formatted } = formatInput(e.target.value);
      setDisplayValue(formatted);

      if (digits.length === 8) {
        const mm = parseInt(digits.slice(0, 2), 10);
        const dd = parseInt(digits.slice(2, 4), 10);
        const yyyy = parseInt(digits.slice(4, 8), 10);

        if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
          const dateStr = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
          const date = new Date(dateStr);

          if (
            date.getFullYear() === yyyy &&
            date.getMonth() + 1 === mm &&
            date.getDate() === dd
          ) {
            onChange(date);
            return;
          }
        }
      }
      onChange(null);
    };

    const handleKeyDown = (e) => {
      const allowed = [8, 46, 9, 27, 13, 37, 38, 39, 40, 65];
      if (allowed.includes(e.keyCode) || (e.ctrlKey || e.metaKey)) return;
      if (!/[0-9]/.test(e.key)) e.preventDefault();
    };

    return (
      <input
        {...props}
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={onClick}
        placeholder="MM/DD/YYYY"
        className="input-box with-icon"
        autoComplete="off"
        maxLength={10}
      />
    );
  });

  MaskedDateInput.displayName = 'MaskedDateInput';

  return (
    <div className="step-one-fields-with-image">
      <div className="step1-top-row">
        {/* Profile Upload */}
        <div className="profile-upload-section">
          <label htmlFor="profileUpload" className="profile-upload-label">
            {formData.previewUrl ? (
              <img src={formData.previewUrl} className="profile-preview" alt="Preview" />
            ) : (
              <div className="upload-placeholder">Upload Image</div>
            )}
          </label>
          <input
            id="profileUpload"
            type="file"
            accept="image/*"
            hidden
            onChange={onImageChange}
          />
          <button
            type="button"
            onClick={() => document.getElementById('profileUpload').click()}
            className="upload-btn"
          >
            Upload Photo
          </button>
        </div>

        {/* Form Fields */}
        <div className="step1-form-section">
          {/* Role */}
          <div className="stu-form-row">
            <div className="form-group">
              <FormLabel htmlFor="role" label="Role" isRequired={true} />
              <div className="input-icon-container">
                <select
                  name ="role"
                  id="role"
                  className="input-box with-icon"
                  value={formData.role || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.role_name}>
                      {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
                    </option>
                  ))}
                </select>
                <img src={FilterIcon} alt="dropdown" className="input-icon" />
              </div>
              {errors.role && <span className="error">{errors.role}</span>}
            </div>
          </div>

          {/* Salutation, First Name, Last Name */}
          <div className="stu-form-row">
            <div className="form-group">
              <FormLabel htmlFor="salutation" label="Salutation" isRequired={false} />
              <select
                name="salutation"
                id="salutation"
                value={formData.salutation || ''}
                onChange={handleInputChange}
                className="input-box"
              >
                <option value="">Select Salutation</option>
                <option value="Mr">Mr</option>
                <option value="Ms">Ms</option>
                <option value="Mrs">Mrs</option>
              </select>
            </div>

            {/* FIRST NAME - Fixed */}
            <div className="form-group">
              <FormLabel htmlFor="first_name" label="First Name" isRequired={true} />
              <input
                type="text"
                name="first_name"
                id="first_name"
                value={formData.first_name || ''}
                onChange={handleNameChange}
                className={`input-box ${
                  errors.first_name || isNameInvalid(formData.first_name) ? 'error-border' : ''
                }`}
                placeholder="e.g. Maya"
                autoComplete="off"
              />
              {errors.first_name ? (
                <span className="error">{errors.first_name}</span>
              ) : isNameInvalid(formData.first_name) ? (
                <span className="error">Only letters, spaces, hyphens, and apostrophes are allowed</span>
              ) : null}
            </div>

            {/* LAST NAME - Fixed */}
            <div className="form-group">
              <FormLabel htmlFor="last_name" label="Last Name" isRequired={true} />
              <input
                type="text"
                name="last_name"
                id="last_name"
                value={formData.last_name || ''}
                onChange={handleNameChange}
                className={`input-box ${
                  errors.last_name || isNameInvalid(formData.last_name) ? 'error-border' : ''
                }`}
                placeholder="e.g. Perera"
                autoComplete="off"
              />
              {errors.last_name ? (
                <span className="error">{errors.last_name}</span>
              ) : isNameInvalid(formData.last_name) ? (
                <span className="error">Only letters, spaces, hyphens, and apostrophes are allowed</span>
              ) : null}
            </div>
          </div>

          {/* DATE OF BIRTH + GENDER */}
          <div className="stu-form-row">
            <div className="form-group dob-group">
              <FormLabel htmlFor="date_of_birth" label="Date of Birth" isRequired={true} />
              <div className="input-icon-container">
                <DatePicker
                  ref={datePickerRef}
                  selected={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    if (date) {
                      const iso = date.toISOString().split('T')[0];
                      onChange({ date_of_birth: iso });
                    } else {
                      onChange({ date_of_birth: '' });
                    }
                  }}
                  customInput={<MaskedDateInput />}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="MM/DD/YYYY"
                />
                <img
                  src={CalendarIcon}
                  alt="calendar"
                  className="input-icon calendar-icon"
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onClick={() => datePickerRef.current?.setOpen(true)}
                />
              </div>
              {errors.date_of_birth && <span className="error">{errors.date_of_birth}</span>}
            </div>

            <div className="form-group">
              <FormLabel htmlFor="gender" label="Gender" isRequired={false} />
              <div className="input-icon-container">
                <select
                  name="gender"
                  id="gender"
                  className="input-box with-icon"
                  value={formData.gender || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <img src={FilterIcon} alt="dropdown" className="input-icon" />
              </div>
              {errors.gender && <span className="error">{errors.gender}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1PersonalInfo;