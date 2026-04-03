import React from 'react';

const ClearanceImprovement = () => {
    return (
        <div className="clearance-container">
            <h2 className="page-title">Application for Clearance/Improvement Courses</h2>

            <div className="iums-section-card">
                <h3>List of clearance courses</h3>
                <p className="success-text">You don't have any 'Clearance' course(s) to apply for this semester.</p>
            </div>

            <div className="iums-section-card">
                <h3 className="section-title">Select Improvement Course(s) and Apply</h3>
                <table className="iums-green-table">
                    <thead>
                        <tr>
                            <th>COURSE NO</th>
                            <th>COURSE TITLE</th>
                            <th>COURSE YEAR-SEMESTER</th>
                            <th>GRADE</th>
                            <th>SELECT</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><select className="table-select"><option>Select a course</option></select></td>
                            <td>---</td>
                            <td>---</td>
                            <td>---</td>
                            <td><input type="checkbox" disabled /></td>
                        </tr>
                    </tbody>
                </table>
                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                    <button className="btn-disabled" disabled>Apply for Improvement</button>
                </div>
            </div>
        </div>
    );
};
export default ClearanceImprovement;