"use strict";
/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(self["webpackChunkcapstone2_kanban"] = self["webpackChunkcapstone2_kanban"] || []).push([["APIs"],{

/***/ "./src/modules/APIsGET&POST.js":
/*!*************************************!*\
  !*** ./src/modules/APIsGET&POST.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"checkAPI\": () => (/* binding */ checkAPI),\n/* harmony export */   \"getAnime\": () => (/* binding */ getAnime),\n/* harmony export */   \"getComments\": () => (/* binding */ getComments),\n/* harmony export */   \"getLikes\": () => (/* binding */ getLikes),\n/* harmony export */   \"postComments\": () => (/* binding */ postComments),\n/* harmony export */   \"postLikes\": () => (/* binding */ postLikes)\n/* harmony export */ });\nconst getAnime = async (url) => {\n  // If URL contains 'jikan.moe' it's a public API; fetch without special headers\n  try {\n    const response = await fetch(url, { method: 'GET' });\n    return await response.json();\n  } catch (err) {\n    console.warn('getAnime fetch failed', err);\n    throw err;\n  }\n};\n\n// Lightweight health-check with timeout to confirm public API availability\nasync function checkAPI(url, timeout = 3000) {\n  const controller = new AbortController();\n  const id = setTimeout(() => controller.abort(), timeout);\n  try {\n    const res = await fetch(url, { method: 'GET', signal: controller.signal });\n    clearTimeout(id);\n    return res.ok;\n  } catch (err) {\n    clearTimeout(id);\n    return false;\n  }\n}\n\nconst getLikes = async (url) => {\n  const response = await fetch(url).then((res) => res.json());\n  return response;\n};\n\nasync function getComments(url) {\n  const response = await fetch(url).then((res) => res.json());\n  return response;\n}\n\nconst postComments = async (id, username, comment, url) => {\n  await fetch(url, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n    },\n    body: JSON.stringify({\n      item_id: id,\n      username,\n      comment,\n    }),\n  });\n};\n\nconst postLikes = async (id, url) => {\n  await fetch(url, {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n    },\n    body: JSON.stringify({\n      item_id: id,\n    }),\n  });\n};\n\n\n//# sourceURL=webpack://capstone2-kanban/./src/modules/APIsGET&POST.js?");

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/modules/APIsGET&POST.js"));
/******/ }
]);