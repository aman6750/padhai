package com.padhai.backend.controller;
import com.padhai.backend.dto.QuestionForStudent;
import com.padhai.backend.entity.TestAttempt;
import com.padhai.backend.repository.TestAttemptRepository;
import com.padhai.backend.service.SubscriptionService;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import com.padhai.backend.entity.*;
import com.padhai.backend.repository.*;
import com.padhai.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.padhai.backend.entity.TestAttempt;
import java.util.List;
import com.padhai.backend.entity.Subject;
import com.padhai.backend.service.ClassAccessService;

@RestController
@RequestMapping("/api/tests")
public class TestController {

    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final UserService userService;
    private final TestAttemptRepository testAttemptRepository;
    private final SubscriptionService subscriptionService;
    private final ClassAccessService classAccessService;   // NEW

    public TestController(TestRepository testRepository,
                          QuestionRepository questionRepository,
                          UserService userService,
                          TestAttemptRepository testAttemptRepository,
                          SubscriptionService subscriptionService,
                          ClassAccessService classAccessService) {   // NEW
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.userService = userService;
        this.testAttemptRepository = testAttemptRepository;
        this.subscriptionService = subscriptionService;
        this.classAccessService = classAccessService;              // NEW
    }

    private User currentUser() {
        String email = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userService.getByEmail(email);
    }

    private boolean canManageSubject(User user, Long subjectId) {
        if ("ADMIN".equals(user.getRole())) return true;
        if ("TEACHER".equals(user.getRole())) {
            return user.getSubjects().stream().anyMatch(s -> s.getId().equals(subjectId));
        }
        return false;
    }

    // Create a test (teacher of that subject, or admin)
    @PostMapping("/add")
    public Test addTest(@RequestBody Test test) {
        User user = currentUser();
        if (!canManageSubject(user, test.getSubjectId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your subject");
        }
        return testRepository.save(test);
    }

    // Add a question to a test
    @PostMapping("/{testId}/questions/add")
    public Question addQuestion(@PathVariable Long testId, @RequestBody Question question) {
        User user = currentUser();
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));
        if (!canManageSubject(user, test.getSubjectId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your subject");
        }
        question.setTestId(testId);
        return questionRepository.save(question);
    }

    // List tests for a subject: students only for their OWN class
    @GetMapping("/subject/{subjectId}")
    public List<Test> getTestsForSubject(@PathVariable Long subjectId) {
        classAccessService.requireSubjectAccess(currentUser(), subjectId);   // NEW
        return testRepository.findBySubjectId(subjectId);
    }

    // Questions WITH correct answers: teachers/admins ONLY.
    // Before, any student could call this and see the answers!
    // Students take tests through /take, which hides the answers.
    @GetMapping("/{testId}/questions")
    public List<Question> getQuestions(@PathVariable Long testId) {
        if (!classAccessService.isPrivileged(currentUser())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Teachers and admins only");
        }
        return questionRepository.findByTestId(testId);
    }

    // STUDENT: get questions WITHOUT answers — checks free/paid access
    @GetMapping("/{testId}/take")
    public List<QuestionForStudent> takeTest(@PathVariable Long testId) {
        User user = currentUser();
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));
        // NEW: student can't open another class's test (even a free one)
        classAccessService.requireSubjectAccess(user, test.getSubjectId());
        // If the test is paid, require an active subscription
        if (!Boolean.TRUE.equals(test.getIsFree())) {
            boolean privileged = "ADMIN".equals(user.getRole()) || "TEACHER".equals(user.getRole());
            if (!privileged && !subscriptionService.isSubscriptionActive(user.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Subscribe to take this test");
            }
        }

        List<Question> questions = questionRepository.findByTestId(testId);
        List<QuestionForStudent> safe = new ArrayList<>();
        for (Question q : questions) {
            QuestionForStudent s = new QuestionForStudent();
            s.setId(q.getId());
            s.setQuestionText(q.getQuestionText());
            s.setOptionA(q.getOptionA());
            s.setOptionB(q.getOptionB());
            s.setOptionC(q.getOptionC());
            s.setOptionD(q.getOptionD());
            safe.add(s);   // note: correctOption deliberately not copied
        }
        return safe;
    }

    // STUDENT: submit answers — backend scores it
    @PostMapping("/{testId}/submit")
    public Map<String, Object> submitTest(@PathVariable Long testId,
                                          @RequestBody Map<Long, String> answers) {
        User user = currentUser();
        // NEW: load the test to know its subject (and class); wrong id → 404
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));
        // NEW: can't submit answers for another class's test
        classAccessService.requireSubjectAccess(user, test.getSubjectId());
        List<Question> questions = questionRepository.findByTestId(testId);

        int score = 0;
        for (Question q : questions) {
            String studentAnswer = answers.get(q.getId());   // e.g. "B"
            if (q.getCorrectOption().equalsIgnoreCase(studentAnswer)) {
                score++;
            }
        }

        // Save the attempt
        TestAttempt attempt = new TestAttempt();
        attempt.setUserId(user.getId());
        attempt.setTestId(testId);
        attempt.setScore(score);
        attempt.setTotalQuestions(questions.size());
        attempt.setAttemptedAt(LocalDateTime.now());
        testAttemptRepository.save(attempt);

        return Map.of(
                "score", score,
                "total", questions.size()
        );
    }

    // get the logged-in student's own test attempts
    @GetMapping("/my-attempts")
    public List<TestAttempt> myAttempts() {
        User user = currentUser();
        return testAttemptRepository.findByUserId(user.getId());
    }

    // in TestController — count tests the teacher created across their subjects
    @GetMapping("/my-subject-tests/count")
    public Map<String, Integer> myTestCount() {
        User user = currentUser();
        int count = 0;
        for (Subject s : user.getSubjects()) {
            count += testRepository.findBySubjectId(s.getId()).size();
        }
        return Map.of("count", count);
    }


}