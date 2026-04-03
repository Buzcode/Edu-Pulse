-- Check if mawa (Id 4) is enrolled in Course 1
SELECT e.Id, u.Name, c.Title, e.Status 
FROM Enrollments e
JOIN Users u ON e.StudentId = u.Id
JOIN Courses c ON e.CourseId = c.Id
WHERE e.CourseId = 1;