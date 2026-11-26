// Generated from src/data/rpi-cst-routines.ts — code-seeded fallback for Edge Functions.
export type SeedRoutine = { instituteId: string; department: string; semester: number; shift: number; periods: Record<string, string>; subjects: { code: string; name: string; teacher: string }[]; blocks: { day: string; startPeriod: number; endPeriod: number; subjectCode: string; room: string }[] };
export const SEED_ROUTINES: SeedRoutine[] = [
  {
    "instituteId": "rpi",
    "department": "CST",
    "semester": 1,
    "shift": 1,
    "periods": {
      "1": "08:00-08:45",
      "2": "08:45-09:30",
      "3": "09:30-10:15",
      "4": "10:15-11:00",
      "5": "11:00-11:45",
      "6": "11:45-12:30",
      "7": "12:30-13:15"
    },
    "subjects": [
      {
        "code": "21011",
        "name": "Engineering Drawing",
        "teacher": "MD. ABDULLAH-AL MAMUN"
      },
      {
        "code": "25711",
        "name": "Bangla-I",
        "teacher": "MST. RABEYA SIDDIQUA"
      },
      {
        "code": "25712",
        "name": "English-I",
        "teacher": "MD. SHIMUL HOSSAIN"
      },
      {
        "code": "25911",
        "name": "Mathematics-I",
        "teacher": "MD. ABDUR RAZZAK"
      },
      {
        "code": "25912",
        "name": "Physics-I",
        "teacher": "SYED MAHMUDUN NABI KHONDKER"
      },
      {
        "code": "28511",
        "name": "Computer Office Application",
        "teacher": "MD. FARUQ HOSSAIN"
      },
      {
        "code": "26711",
        "name": "Basic Electricity",
        "teacher": "MD. MOHOSIN"
      }
    ],
    "blocks": [
      {
        "day": "Sun",
        "startPeriod": 1,
        "endPeriod": 2,
        "subjectCode": "25912",
        "room": "2106"
      },
      {
        "day": "Sun",
        "startPeriod": 3,
        "endPeriod": 4,
        "subjectCode": "25911",
        "room": "2302"
      },
      {
        "day": "Sun",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "26711",
        "room": "5208"
      },
      {
        "day": "Mon",
        "startPeriod": 1,
        "endPeriod": 2,
        "subjectCode": "25911",
        "room": "2302"
      },
      {
        "day": "Mon",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "25711",
        "room": "2302"
      },
      {
        "day": "Mon",
        "startPeriod": 4,
        "endPeriod": 6,
        "subjectCode": "28511",
        "room": "2301"
      },
      {
        "day": "Mon",
        "startPeriod": 7,
        "endPeriod": 7,
        "subjectCode": "26711",
        "room": "3109"
      },
      {
        "day": "Tue",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "25912",
        "room": "2306"
      },
      {
        "day": "Tue",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "26711",
        "room": "2306"
      },
      {
        "day": "Tue",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25712",
        "room": "2306"
      },
      {
        "day": "Tue",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "21011",
        "room": "2302"
      },
      {
        "day": "Wed",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28511",
        "room": "1308"
      },
      {
        "day": "Wed",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25711",
        "room": "2303"
      },
      {
        "day": "Wed",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "25912",
        "room": "2303"
      },
      {
        "day": "Wed",
        "startPeriod": 6,
        "endPeriod": 6,
        "subjectCode": "26711",
        "room": "2303"
      },
      {
        "day": "Thu",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "25712",
        "room": "2303"
      },
      {
        "day": "Thu",
        "startPeriod": 2,
        "endPeriod": 3,
        "subjectCode": "25911",
        "room": "2303"
      },
      {
        "day": "Thu",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25912",
        "room": "2305"
      },
      {
        "day": "Thu",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "21011",
        "room": "2305"
      }
    ]
  },
  {
    "instituteId": "rpi",
    "department": "CST",
    "semester": 3,
    "shift": 1,
    "periods": {
      "1": "08:00-08:45",
      "2": "08:45-09:30",
      "3": "09:30-10:15",
      "4": "10:15-11:00",
      "5": "11:00-11:45",
      "6": "11:45-12:30",
      "7": "12:30-13:15"
    },
    "subjects": [
      {
        "code": "25811",
        "name": "Social Science",
        "teacher": "SAMROZ NAHAR"
      },
      {
        "code": "25922",
        "name": "Physics-II",
        "teacher": "MST. NAZMUN NAHER"
      },
      {
        "code": "25931",
        "name": "Mathematics-III",
        "teacher": "ANJUMAN ARA"
      },
      {
        "code": "28531",
        "name": "Application Development Using Python",
        "teacher": "MD. SORIAT ULLAH"
      },
      {
        "code": "28532",
        "name": "Computer Graphics Design-II",
        "teacher": "MD. AZIZUL AMAN AL AMIN"
      },
      {
        "code": "28533",
        "name": "IT Support Services",
        "teacher": "MD. ABDULLAH-AL MAMUN"
      },
      {
        "code": "26831",
        "name": "Digital Electronics-I",
        "teacher": "MD. NURUN NOBE"
      }
    ],
    "blocks": [
      {
        "day": "Sun",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "28531",
        "room": "2302"
      },
      {
        "day": "Sun",
        "startPeriod": 3,
        "endPeriod": 4,
        "subjectCode": "25922",
        "room": "2106"
      },
      {
        "day": "Sun",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "28533",
        "room": "2306"
      },
      {
        "day": "Sun",
        "startPeriod": 6,
        "endPeriod": 7,
        "subjectCode": "25931",
        "room": "2306"
      },
      {
        "day": "Mon",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28533",
        "room": "1305"
      },
      {
        "day": "Mon",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25811",
        "room": "1305"
      },
      {
        "day": "Mon",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28531",
        "room": "1308"
      },
      {
        "day": "Tue",
        "startPeriod": 1,
        "endPeriod": 2,
        "subjectCode": "25931",
        "room": "2302"
      },
      {
        "day": "Tue",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "26831",
        "room": "2302"
      },
      {
        "day": "Tue",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25922",
        "room": "2302"
      },
      {
        "day": "Tue",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28532",
        "room": "1305"
      },
      {
        "day": "Wed",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "26831",
        "room": "5201"
      },
      {
        "day": "Wed",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25922",
        "room": "1305"
      },
      {
        "day": "Wed",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28533",
        "room": "1305"
      },
      {
        "day": "Thu",
        "startPeriod": 1,
        "endPeriod": 2,
        "subjectCode": "25931",
        "room": "2306"
      },
      {
        "day": "Thu",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "25922",
        "room": "2306"
      },
      {
        "day": "Thu",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28533",
        "room": "2306"
      },
      {
        "day": "Thu",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "28531",
        "room": "2306"
      },
      {
        "day": "Thu",
        "startPeriod": 6,
        "endPeriod": 6,
        "subjectCode": "25922",
        "room": "2306"
      },
      {
        "day": "Thu",
        "startPeriod": 7,
        "endPeriod": 7,
        "subjectCode": "26831",
        "room": "2306"
      }
    ]
  },
  {
    "instituteId": "rpi",
    "department": "CST",
    "semester": 4,
    "shift": 1,
    "periods": {
      "1": "08:00-08:45",
      "2": "08:45-09:30",
      "3": "09:30-10:15",
      "4": "10:15-11:00",
      "5": "11:00-11:45",
      "6": "11:45-12:30",
      "7": "12:30-13:15"
    },
    "subjects": [
      {
        "code": "25831",
        "name": "Business Communication",
        "teacher": "SYEDA SADIKA AKHTER JAHAN"
      },
      {
        "code": "28541",
        "name": "Java Programming",
        "teacher": "MD. FARUQ HOSSAIN"
      },
      {
        "code": "28542",
        "name": "Data Structure & Algorithm",
        "teacher": "MD. FAZLUL HAQUE"
      },
      {
        "code": "28543",
        "name": "Computer Peripherals & Interfacing",
        "teacher": "MD. ABDULLAH-AL MAMUN"
      },
      {
        "code": "28544",
        "name": "Web Design & Development-I",
        "teacher": "MD. SORIAT ULLAH"
      },
      {
        "code": "26841",
        "name": "Digital Electronics-II",
        "teacher": "MD. MOHON ALI"
      },
      {
        "code": "29041",
        "name": "Environmental Studies",
        "teacher": "SYEDA SADIKA AKHTER JAHAN"
      }
    ],
    "blocks": [
      {
        "day": "Sun",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28543",
        "room": "1305"
      },
      {
        "day": "Sun",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28542",
        "room": "1305"
      },
      {
        "day": "Sun",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28541",
        "room": "1302"
      },
      {
        "day": "Mon",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "26841",
        "room": "5201"
      },
      {
        "day": "Mon",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28542",
        "room": "2302"
      },
      {
        "day": "Mon",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "25831",
        "room": "2303"
      },
      {
        "day": "Mon",
        "startPeriod": 6,
        "endPeriod": 6,
        "subjectCode": "28543",
        "room": "2303"
      },
      {
        "day": "Mon",
        "startPeriod": 7,
        "endPeriod": 7,
        "subjectCode": "28541",
        "room": "2303"
      },
      {
        "day": "Tue",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28544",
        "room": "1302"
      },
      {
        "day": "Tue",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28543",
        "room": "1302"
      },
      {
        "day": "Tue",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "29041",
        "room": "2303"
      },
      {
        "day": "Wed",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "29041",
        "room": "2302"
      },
      {
        "day": "Wed",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "26841",
        "room": "2302"
      },
      {
        "day": "Wed",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "28543",
        "room": "2302"
      },
      {
        "day": "Wed",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28544",
        "room": "2302"
      },
      {
        "day": "Wed",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28542",
        "room": "1308"
      },
      {
        "day": "Thu",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28544",
        "room": "1302"
      },
      {
        "day": "Thu",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "26841",
        "room": "2303"
      },
      {
        "day": "Thu",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "25831",
        "room": "2303"
      },
      {
        "day": "Thu",
        "startPeriod": 6,
        "endPeriod": 6,
        "subjectCode": "28541",
        "room": "2303"
      },
      {
        "day": "Thu",
        "startPeriod": 7,
        "endPeriod": 7,
        "subjectCode": "29041",
        "room": "2303"
      }
    ]
  },
  {
    "instituteId": "rpi",
    "department": "CST",
    "semester": 6,
    "shift": 1,
    "periods": {
      "1": "08:00-08:45",
      "2": "08:45-09:30",
      "3": "09:30-10:15",
      "4": "10:15-11:00",
      "5": "11:00-11:45",
      "6": "11:45-12:30",
      "7": "12:30-13:15"
    },
    "subjects": [
      {
        "code": "25851",
        "name": "Principles of Marketing",
        "teacher": "SYEDA SADIKA AKHTER JAHAN"
      },
      {
        "code": "25852",
        "name": "Industrial Management",
        "teacher": "SYEDA SADIKA AKHTER JAHAN"
      },
      {
        "code": "28561",
        "name": "Database Management System",
        "teacher": "MST. RIYA KHATUN"
      },
      {
        "code": "28562",
        "name": "Computer Networking",
        "teacher": "MD. FARUQ HOSSAIN"
      },
      {
        "code": "28563",
        "name": "Sensor & IoT System",
        "teacher": "MD. SOHEL PARVAGE"
      },
      {
        "code": "28564",
        "name": "Microcontroller Based System Design & Development",
        "teacher": "MD. SOHEL PARVAGE"
      },
      {
        "code": "28565",
        "name": "Surveillance Security System",
        "teacher": "MD. AZIZUL AMAN AL AMIN"
      },
      {
        "code": "28566",
        "name": "Web Development Project",
        "teacher": "MD. SORIAT ULLAH"
      }
    ],
    "blocks": [
      {
        "day": "Sun",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28565",
        "room": "1308"
      },
      {
        "day": "Sun",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28561",
        "room": "2303"
      },
      {
        "day": "Sun",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "25851",
        "room": "2303"
      },
      {
        "day": "Sun",
        "startPeriod": 6,
        "endPeriod": 6,
        "subjectCode": "28564",
        "room": "2303"
      },
      {
        "day": "Mon",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "25852",
        "room": "2303"
      },
      {
        "day": "Mon",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "28565",
        "room": "2303"
      },
      {
        "day": "Mon",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "28562",
        "room": "2303"
      },
      {
        "day": "Mon",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28563",
        "room": "2303"
      },
      {
        "day": "Mon",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28564",
        "room": "1305"
      },
      {
        "day": "Tue",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "25851",
        "room": "2303"
      },
      {
        "day": "Tue",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "28561",
        "room": "2303"
      },
      {
        "day": "Tue",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "28564",
        "room": "2303"
      },
      {
        "day": "Tue",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28563",
        "room": "2303"
      },
      {
        "day": "Tue",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28562",
        "room": "1302"
      },
      {
        "day": "Wed",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28561",
        "room": "1302"
      },
      {
        "day": "Wed",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25852",
        "room": "1302"
      },
      {
        "day": "Wed",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28566",
        "room": "1302"
      },
      {
        "day": "Thu",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28564",
        "room": "1305"
      },
      {
        "day": "Thu",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28562",
        "room": "1305"
      },
      {
        "day": "Thu",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28563",
        "room": "1305"
      }
    ]
  },
  {
    "instituteId": "rpi",
    "department": "CST",
    "semester": 1,
    "shift": 2,
    "periods": {
      "1": "13:30-14:15",
      "2": "14:15-15:00",
      "3": "15:00-15:45",
      "4": "15:45-16:30",
      "5": "16:30-17:15",
      "6": "17:15-18:00",
      "7": "18:00-18:45"
    },
    "subjects": [
      {
        "code": "21011",
        "name": "Engineering Drawing",
        "teacher": "Md. Zahangir Alom"
      },
      {
        "code": "25711",
        "name": "Bangla-I",
        "teacher": "Md. Monjur Rahman Rabbi"
      },
      {
        "code": "25712",
        "name": "English-I",
        "teacher": "Mahmudunnabi Milon"
      },
      {
        "code": "25911",
        "name": "Mathematics-I",
        "teacher": "Md. Shakil Uddin"
      },
      {
        "code": "25912",
        "name": "Physics-I",
        "teacher": "Md. Al-Mamun"
      },
      {
        "code": "28511",
        "name": "Computer Office Application",
        "teacher": "Md. Shahinul Islam"
      },
      {
        "code": "26711",
        "name": "Basic Electricity",
        "teacher": "Amit Kumar Pramanik"
      }
    ],
    "blocks": [
      {
        "day": "Sun",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "21011",
        "room": "2305"
      },
      {
        "day": "Sun",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25911",
        "room": "2206"
      },
      {
        "day": "Sun",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "25711",
        "room": "2303"
      },
      {
        "day": "Sun",
        "startPeriod": 6,
        "endPeriod": 6,
        "subjectCode": "25912",
        "room": "2303"
      },
      {
        "day": "Mon",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "25911",
        "room": "3209"
      },
      {
        "day": "Mon",
        "startPeriod": 2,
        "endPeriod": 4,
        "subjectCode": "26711",
        "room": "5210"
      },
      {
        "day": "Mon",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "25912",
        "room": "2106"
      },
      {
        "day": "Tue",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "26711",
        "room": "2303"
      },
      {
        "day": "Tue",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "25712",
        "room": "2303"
      },
      {
        "day": "Tue",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "25711",
        "room": "2303"
      },
      {
        "day": "Tue",
        "startPeriod": 4,
        "endPeriod": 6,
        "subjectCode": "21011",
        "room": "2305"
      },
      {
        "day": "Tue",
        "startPeriod": 7,
        "endPeriod": 7,
        "subjectCode": "25912",
        "room": "2305"
      },
      {
        "day": "Wed",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28511",
        "room": "1302"
      },
      {
        "day": "Wed",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25712",
        "room": "3402"
      },
      {
        "day": "Wed",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "26711",
        "room": "3402"
      },
      {
        "day": "Wed",
        "startPeriod": 6,
        "endPeriod": 7,
        "subjectCode": "25911",
        "room": "3402"
      },
      {
        "day": "Thu",
        "startPeriod": 1,
        "endPeriod": 2,
        "subjectCode": "25911",
        "room": "2306"
      },
      {
        "day": "Thu",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "25912",
        "room": "2306"
      },
      {
        "day": "Thu",
        "startPeriod": 4,
        "endPeriod": 6,
        "subjectCode": "28511",
        "room": "1302"
      },
      {
        "day": "Thu",
        "startPeriod": 7,
        "endPeriod": 7,
        "subjectCode": "26711",
        "room": "2303"
      }
    ]
  },
  {
    "instituteId": "rpi",
    "department": "CST",
    "semester": 3,
    "shift": 2,
    "periods": {
      "1": "13:30-14:15",
      "2": "14:15-15:00",
      "3": "15:00-15:45",
      "4": "15:45-16:30",
      "5": "16:30-17:15",
      "6": "17:15-18:00",
      "7": "18:00-18:45"
    },
    "subjects": [
      {
        "code": "25811",
        "name": "Social Science",
        "teacher": "Md. Shakil Uddin"
      },
      {
        "code": "25922",
        "name": "Physics-II",
        "teacher": "Abdullah Al Mahmud"
      },
      {
        "code": "25931",
        "name": "Mathematics-III",
        "teacher": "Abdullah Al Tarek"
      },
      {
        "code": "28531",
        "name": "Application Development Using Python",
        "teacher": "Md. Shahinul Islam"
      },
      {
        "code": "28532",
        "name": "Computer Graphics Design-II",
        "teacher": "Md. Shahinul Islam"
      },
      {
        "code": "28533",
        "name": "IT Support Services",
        "teacher": "Mohammad Ali"
      },
      {
        "code": "26831",
        "name": "Digital Electronics-I",
        "teacher": "Md. Shaho Zaman"
      }
    ],
    "blocks": [
      {
        "day": "Sun",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "25811",
        "room": "2306"
      },
      {
        "day": "Sun",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "28533",
        "room": "2306"
      },
      {
        "day": "Sun",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "28531",
        "room": "2306"
      },
      {
        "day": "Sun",
        "startPeriod": 4,
        "endPeriod": 6,
        "subjectCode": "25922",
        "room": "2106"
      },
      {
        "day": "Sun",
        "startPeriod": 7,
        "endPeriod": 7,
        "subjectCode": "25931",
        "room": "2306"
      },
      {
        "day": "Mon",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28531",
        "room": "1308"
      },
      {
        "day": "Mon",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25922",
        "room": "2303"
      },
      {
        "day": "Mon",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "28533",
        "room": "2303"
      },
      {
        "day": "Mon",
        "startPeriod": 6,
        "endPeriod": 7,
        "subjectCode": "25931",
        "room": "2303"
      },
      {
        "day": "Tue",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "26831",
        "room": "2306"
      },
      {
        "day": "Tue",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "28531",
        "room": "2306"
      },
      {
        "day": "Tue",
        "startPeriod": 3,
        "endPeriod": 4,
        "subjectCode": "25931",
        "room": "2306"
      },
      {
        "day": "Tue",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28533",
        "room": "1305"
      },
      {
        "day": "Wed",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "26831",
        "room": "5206"
      },
      {
        "day": "Wed",
        "startPeriod": 4,
        "endPeriod": 6,
        "subjectCode": "28532",
        "room": "1308"
      },
      {
        "day": "Wed",
        "startPeriod": 7,
        "endPeriod": 7,
        "subjectCode": "25922",
        "room": "1308"
      },
      {
        "day": "Thu",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28533",
        "room": "1305"
      },
      {
        "day": "Thu",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25931",
        "room": "2306"
      },
      {
        "day": "Thu",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "25922",
        "room": "2306"
      },
      {
        "day": "Thu",
        "startPeriod": 6,
        "endPeriod": 6,
        "subjectCode": "25811",
        "room": "2306"
      },
      {
        "day": "Thu",
        "startPeriod": 7,
        "endPeriod": 7,
        "subjectCode": "26831",
        "room": "2306"
      }
    ]
  },
  {
    "instituteId": "rpi",
    "department": "CST",
    "semester": 4,
    "shift": 2,
    "periods": {
      "1": "13:30-14:15",
      "2": "14:15-15:00",
      "3": "15:00-15:45",
      "4": "15:45-16:30",
      "5": "16:30-17:15",
      "6": "17:15-18:00",
      "7": "18:00-18:45"
    },
    "subjects": [
      {
        "code": "25831",
        "name": "Business Communication",
        "teacher": "Md. Abu Bakkar"
      },
      {
        "code": "28541",
        "name": "Java Programming",
        "teacher": "Md. Shahinul Islam"
      },
      {
        "code": "28542",
        "name": "Data Structure & Algorithm",
        "teacher": "Mohammad Ali"
      },
      {
        "code": "28543",
        "name": "Computer Peripherals & Interfacing",
        "teacher": "Kousik Kumar Halder"
      },
      {
        "code": "28544",
        "name": "Web Design & Development-I",
        "teacher": "Md. Abu Bakkar"
      },
      {
        "code": "26841",
        "name": "Digital Electronics-II",
        "teacher": "Asaduzzaman Rabi"
      },
      {
        "code": "29041",
        "name": "Environmental Studies",
        "teacher": "Nilima Sultana"
      }
    ],
    "blocks": [
      {
        "day": "Sun",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "26841",
        "room": "2303"
      },
      {
        "day": "Sun",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "29041",
        "room": "2303"
      },
      {
        "day": "Sun",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "28542",
        "room": "2303"
      },
      {
        "day": "Sun",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25831",
        "room": "2303"
      },
      {
        "day": "Sun",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28541",
        "room": "1308"
      },
      {
        "day": "Mon",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28542",
        "room": "1302"
      },
      {
        "day": "Mon",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28543",
        "room": "2306"
      },
      {
        "day": "Mon",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "29041",
        "room": "2206"
      },
      {
        "day": "Tue",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "26841",
        "room": "5202"
      },
      {
        "day": "Tue",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28543",
        "room": "1302"
      },
      {
        "day": "Tue",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28544",
        "room": "1302"
      },
      {
        "day": "Wed",
        "startPeriod": 4,
        "endPeriod": 6,
        "subjectCode": "28543",
        "room": "1305"
      },
      {
        "day": "Wed",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "28544",
        "room": "2306"
      },
      {
        "day": "Wed",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "28542",
        "room": "2306"
      },
      {
        "day": "Wed",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "25831",
        "room": "2306"
      },
      {
        "day": "Wed",
        "startPeriod": 7,
        "endPeriod": 7,
        "subjectCode": "28541",
        "room": "2306"
      },
      {
        "day": "Thu",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28544",
        "room": "1302"
      },
      {
        "day": "Thu",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "29041",
        "room": "1305"
      },
      {
        "day": "Thu",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "26841",
        "room": "2305"
      },
      {
        "day": "Thu",
        "startPeriod": 6,
        "endPeriod": 6,
        "subjectCode": "28543",
        "room": "2305"
      },
      {
        "day": "Thu",
        "startPeriod": 7,
        "endPeriod": 7,
        "subjectCode": "28541",
        "room": "2305"
      }
    ]
  },
  {
    "instituteId": "rpi",
    "department": "CST",
    "semester": 6,
    "shift": 2,
    "periods": {
      "1": "13:30-14:15",
      "2": "14:15-15:00",
      "3": "15:00-15:45",
      "4": "15:45-16:30",
      "5": "16:30-17:15",
      "6": "17:15-18:00",
      "7": "18:00-18:45"
    },
    "subjects": [
      {
        "code": "25851",
        "name": "Principles of Marketing",
        "teacher": "Urmi Aktar"
      },
      {
        "code": "25852",
        "name": "Industrial Management",
        "teacher": "Md. Abdul Malek Pramanik"
      },
      {
        "code": "28561",
        "name": "Database Management System",
        "teacher": "Md. Abu Bakkar"
      },
      {
        "code": "28562",
        "name": "Computer Networking",
        "teacher": "Kousik Kumar Halder"
      },
      {
        "code": "28563",
        "name": "Sensor & IoT System",
        "teacher": "Md. Shakil Uddin"
      },
      {
        "code": "28564",
        "name": "Microcontroller Based System Design & Development",
        "teacher": "Nasrin Akter"
      },
      {
        "code": "28565",
        "name": "Surveillance Security System",
        "teacher": "Kousik Kumar Halder"
      },
      {
        "code": "28566",
        "name": "Web Development Project",
        "teacher": "Md. Abu Bakkar"
      }
    ],
    "blocks": [
      {
        "day": "Sun",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28561",
        "room": "1305"
      },
      {
        "day": "Sun",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25852",
        "room": "1305"
      },
      {
        "day": "Sun",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28563",
        "room": "1302"
      },
      {
        "day": "Mon",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28562",
        "room": "1305"
      },
      {
        "day": "Mon",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28563",
        "room": "1305"
      },
      {
        "day": "Mon",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28564",
        "room": "1305"
      },
      {
        "day": "Tue",
        "startPeriod": 1,
        "endPeriod": 3,
        "subjectCode": "28562",
        "room": "1302"
      },
      {
        "day": "Tue",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28561",
        "room": "1302"
      },
      {
        "day": "Tue",
        "startPeriod": 5,
        "endPeriod": 5,
        "subjectCode": "28563",
        "room": "2306"
      },
      {
        "day": "Tue",
        "startPeriod": 6,
        "endPeriod": 6,
        "subjectCode": "28564",
        "room": "2306"
      },
      {
        "day": "Wed",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "28564",
        "room": "2303"
      },
      {
        "day": "Wed",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "25851",
        "room": "2303"
      },
      {
        "day": "Wed",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "28562",
        "room": "2303"
      },
      {
        "day": "Wed",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "25852",
        "room": "2303"
      },
      {
        "day": "Wed",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28566",
        "room": "1305"
      },
      {
        "day": "Thu",
        "startPeriod": 1,
        "endPeriod": 1,
        "subjectCode": "28562",
        "room": "1308"
      },
      {
        "day": "Thu",
        "startPeriod": 2,
        "endPeriod": 2,
        "subjectCode": "25851",
        "room": "2303"
      },
      {
        "day": "Thu",
        "startPeriod": 3,
        "endPeriod": 3,
        "subjectCode": "28565",
        "room": "2303"
      },
      {
        "day": "Thu",
        "startPeriod": 4,
        "endPeriod": 4,
        "subjectCode": "28561",
        "room": "2303"
      },
      {
        "day": "Thu",
        "startPeriod": 5,
        "endPeriod": 7,
        "subjectCode": "28564",
        "room": "1305"
      }
    ]
  }
];
