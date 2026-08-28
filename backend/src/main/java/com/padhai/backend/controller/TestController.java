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

import java.util.List;

@RestController
@RequestMapping("/api/tests")
public class TestController {

    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final UserService userService;
    private final TestAttemptRepository testAttemptRepository;
    private final SubscriptionService subscriptionService;

    public TestController(TestRepository testRepository,
                          QuestionRepository questionRepository,
                          UserService userService,
                          TestAttemptRepository testAttemptRepository,
                          SubscriptionService subscriptionService) {
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.userService = userService;
        this.testAttemptRepository = testAttemptRepository;
        this.subscriptionService = subscriptionService;
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

    // List tests for a subject (anyone logged in can see the list)
    @GetMapping("/subject/{subjectId}")
    public List<Test> getTestsForSubject(@PathVariable Long subjectId) {
        return testRepository.findBySubjectId(subjectId);
    }

    // Get questions for a test (for the teacher to review, or when taking)
    @GetMapping("/{testId}/questions")
    public List<Question> getQuestions(@PathVariable Long testId) {
        return questionRepository.findByTestId(testId);
    }


    // STUDENT: get questions WITHOUT answers — checks free/paid access
    @GetMapping("/{testId}/take")
    public List<QuestionForStudent> takeTest(@PathVariable Long testId) {
        User user = currentUser();
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));

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
}