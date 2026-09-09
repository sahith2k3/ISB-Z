import { Router, type IRouter } from "express";
import {
  ListStudentsQueryParams,
  ListStudentsResponse,
  GetStudentParams,
  GetStudentResponse,
  GetStudentStatusParams,
  GetStudentStatusResponse,
  GetStudentScheduleParams,
  GetStudentScheduleResponse,
  GetStudentScheduleForDateParams,
  GetStudentScheduleForDateResponse,
} from "@workspace/api-zod";
import {
  getStudentById,
  searchStudents,
  getScheduleForDate,
  getWorkingDaySchedules,
  getLiveStatus,
  toStudentSummary,
  nowInKolkata,
} from "../lib/campusData";

const router: IRouter = Router();

router.get("/students", (req, res): void => {
  const query = ListStudentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const results = searchStudents(query.data);
  res.json(ListStudentsResponse.parse(results));
});

router.get("/students/:id", (req, res): void => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const student = getStudentById(params.data.id);
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(GetStudentResponse.parse(student));
});

router.get("/students/:id/status", (req, res): void => {
  const params = GetStudentStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const student = getStudentById(params.data.id);
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const status = getLiveStatus(student.id);
  res.json(
    GetStudentStatusResponse.parse({
      student: toStudentSummary(student),
      ...status,
    }),
  );
});

router.get("/students/:id/schedule", (req, res): void => {
  const params = GetStudentScheduleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const student = getStudentById(params.data.id);
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const { date } = nowInKolkata();
  const schedule = getScheduleForDate(student.id, date);
  res.json(GetStudentScheduleResponse.parse(schedule));
});

router.get("/students/:id/schedule/working-days", (req, res): void => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const student = getStudentById(params.data.id);
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(getWorkingDaySchedules(student.id));
});

router.get("/students/:id/schedule/:date", (req, res): void => {
  const params = GetStudentScheduleForDateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const student = getStudentById(params.data.id);
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const schedule = getScheduleForDate(student.id, params.data.date);
  res.json(GetStudentScheduleForDateResponse.parse(schedule));
});

export default router;
