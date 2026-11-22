import { useState, useEffect } from 'react';
import api from '../services/api';

// Two dropdowns: first the school, then the classes OF THAT SCHOOL.
// Used on Register and on the Dashboard.
// onChange(classId) is called whenever the chosen class changes ('' = none).
function SchoolClassPicker({ onChange }) {
  const [schools, setSchools] = useState([]);   // all schools
  const [schoolId, setSchoolId] = useState(''); // picked school
  const [classes, setClasses] = useState([]);   // classes of the picked school
  const [classId, setClassId] = useState('');   // picked class

  // Load schools once when the dropdowns appear (public URL, no login needed)
  useEffect(() => {
    api.get('/api/schools')
      .then((res) => setSchools(res.data))
      .catch(() => setSchools([]));
  }, []);

  // A school was picked → reset the class and load that school's classes
  const pickSchool = async (id) => {
    setSchoolId(id);
    setClassId('');
    onChange('');                      // no class chosen yet
    if (!id) { setClasses([]); return; }
    try {
      // GET /api/classes?schoolId=1 → only LPS classes, for example
      const res = await api.get(`/api/classes?schoolId=${id}`);
      setClasses(res.data);
    } catch {
      setClasses([]);
    }
  };

  // A class was picked → remember it and tell the parent page
  const pickClass = (id) => {
    setClassId(id);
    onChange(id);
  };

  return (
    <>
      <select className="input" value={schoolId} onChange={(e) => pickSchool(e.target.value)}>
        <option value="">Select your school</option>
        {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {/* disabled until a school is picked */}
      <select className="input" value={classId} disabled={!schoolId}
        onChange={(e) => pickClass(e.target.value)}>
        <option value="">{schoolId ? 'Select your class' : 'Select a school first'}</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </>
  );
}

export default SchoolClassPicker;