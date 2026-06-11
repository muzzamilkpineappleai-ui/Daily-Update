import React, { useState, useEffect } from 'react';
import '../../Styles/Branch/BranchList.css';
import Edit from '../../assets/icons/Edit.png';
import Delete from '../../assets/icons/Delete.png';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import AddBranch from './AddBranch';
import SearchIcon from '../../assets/icons/searchButton.png';
import Toast from '../../modals/ToastModel';
import Success from '../../assets/icons/Success.png';
import Error from '../../assets/icons/error.png';
import deleteIcon from '../../assets/icons/Delete.png';
import { getAllBranches, deleteBranch } from '../../integration/branchApi';

function BranchList() {
  const [showToast, setShowToast] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [toastData, setToastData] = useState({
    title: '',
    message: '',
    icon: Success,
    isDelete: false,
  });
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await getAllBranches();
        setBranches(data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBranches();
  }, []);

  const showToastNotification = (message, isSuccess = true, isDelete = false) => {
    setToastData({
      title: isSuccess ? 'Success' : 'Error',
      message,
      icon: isDelete ? deleteIcon : isSuccess ? Success : Error,
      isDelete,
    });
    setIsError(!isSuccess);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddBtnClick = () => {
    setBranchToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (branch) => {
    setBranchToEdit(branch);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (branch) => {
    setBranchToDelete(branch);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteBranch(branchToDelete.id);
      setBranches(branches.filter(b => b.id !== branchToDelete.id));
      showToastNotification(`Branch ${branchToDelete.branch_name} deleted successfully!`, true, true);
    } catch (error) {
      console.error('Error deleting branch:', error);
      showToastNotification(error.message || 'Failed to delete branch.', false);
    }
    setBranchToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleAddBranch = (newBranch) => {
    setBranches([...branches, newBranch]);
    showToastNotification('Branch added successfully!');
  };

  const handleUpdateBranch = (updatedBranch) => {
  setBranches(branches.map(b =>
    b.id === updatedBranch.id ? { ...b, ...updatedBranch } : b
  ));
  showToastNotification('Branch updated successfully!');
};

  const handleCloseDeleteModal = () => {
    setBranchToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleToastClose = () => {
    setShowToast(false);
    setIsError(false);
  };

  const filteredBranches = branches.filter(b =>
    b.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.currency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="layout-container">
      <div className="branch-action-row">
        <div className="branch-search-box">
          <input
            type="text"
            placeholder="Search by Branch"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <img src={SearchIcon} alt="Search" className="branch-search-img" />
        </div>
        <div className="branch-add-btn-container">
          <button className="branch-add-btn" onClick={handleAddBtnClick}>
            + Add Branch
          </button>
        </div>
      </div>

      <div className="branch-table-container">
        {isLoading ? (
          <p>Loading branches...</p>
        ) : (
          <table className="branch-table">
            <thead>
              <tr>
                <th className="branch-th">Country</th>
                <th className="branch-th">Branch Name</th>
                <th className="branch-th">Currency</th>
                <th className="branch-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.length > 0 ? (
                filteredBranches.map((b) => (
                  <tr key={b.id}>
                    <td className="branch-td">{b.country}</td>
                    <td className="branch-td">{b.branch_name}</td>
                    <td className="branch-td">{b.currency}</td>
                    <td className="branch-td action-cell">
                      <button className="branch-btn" onClick={() => handleEditClick(b)}>
                        <img src={Edit} alt="Edit" />
                      </button>
                      <button className="branch-btn" onClick={() => handleDeleteClick(b)}>
                        <img src={Delete} alt="Delete" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="branch-td" style={{ textAlign: "center" }}>
                    No branches found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={handleConfirmDelete}
      />

      <AddBranch
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddBranch}
        onUpdate={handleUpdateBranch}
        branchToEdit={branchToEdit}
      />

      <Toast
        showToast={showToast}
        isError={isError}
        onClose={handleToastClose}
        title={toastData.title}
        message={toastData.message}
        icon={toastData.icon}
        isDelete={toastData.isDelete}
      />
    </div>
  );
}

export default BranchList;