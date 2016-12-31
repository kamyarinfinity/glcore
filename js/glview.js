/*
 * a utility object for applying
 * vector/matrix operations and
 * model/view/projection matrix creation
 *
 * @author Kamyar Allahverdi, 2015
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 */
"use strict";
(function(namespace) {

	var glview = {
		vector: {
			add: function(v1, v2) {
				return v1.map(function(v, i) {
					return v + v2[i];
				})
			},
			sub: function(v1, v2) {
				return v1.map(function(v, i) {
					return v - v2[i];
				})
			},
			length: function(v) {
				return Math.sqrt(v.reduce(function(p, c) {
					return p + c * c;
				}, 0));
			},
			sqdist: function(v1, v2) {
				// faster faster
				var sum = 0;
				for (var i = 0; i < v1.length; i++) {
					sum += (v1[i] - v2[i]) * (v1[i] - v2[i]);
				}
				return sum;
			},
			dist: function(v1, v2) {
				return Math.sqrt(this.sqdist(v1,v2));
			},
			scale: function(v, s) {
				var vs = [];
				var len = v.length;
				for (var i = 0; i < len; i++) {
					vs[i] = v[i] * s;
				}
				return vs;
			},
			negate: function(v) {
				return this.scale(v, -1);
			},
			lerp: function(c1, v1, c2, v2) {
				return this.add(this.scale(v1,c1),this.scale(v2,c2));
			},
			dir: function(from,to) {
				return this.normalize(this.sub(to,from));
			},
			normalize: function(v) {
				var l = this.length(v);
				return v.map(function(a) {
					return a / l;
				})
			},
			normalize4d: function(v) {
				return v.map(function(a) {
					return a / v[3];
				})
			},
			dot: function(v1, v2) {
				// return v1.reduce(function(p,c,i){return p+(v1[i]*v2[i]);},0);
				// but no,
				// faster, faster!!
				var sum = 0;
				for (var i = 0; i < v1.length; i++) {
					sum += v1[i] * v2[i];
				}
				return sum;
			},
			pdot: function(v1) {
				return function(v2) {
					return glview.vector.dot(v1, v2);
				}
			},
			cross: function(v1, v2) {
				return [v1[1] * v2[2] - v1[2] * v2[1],
					v1[2] * v2[0] - v1[0] * v2[2],
					v1[0] * v2[1] - v1[1] * v2[0]
				];
			},
			normal: function(p1, p2, p3) {
				var v1 = this.sub(p2, p1);
				var v2 = this.sub(p3, p1);
				// left-handed
				return this.normalize(this.cross(v2, v1));
			},
			homogeneous: function(v) {
				var hv = v.slice(0);
				hv[3] = 1;
				return hv;
			},
			inhomogeneous: function(v) {
				// we assume normalized vectors
				// maybe changed to normalize before slicing
				return v.slice(0, 3);
			}
		},
		rotate: function(axis, angle) {
			var n = this.vector.normalize(axis);
			var cr = Math.cos(angle);
			var sr = Math.sin(angle);
			var cr1 = 1 - cr;
			var sr1 = 1 - sr;

			var res = [];
			res.push([cr + cr1 * n[0] * n[0],
				n[0] * n[1] * cr1 + n[2] * sr,
				n[0] * n[2] * cr1 - n[1] * sr, 0
			]);
			res.push([n[0] * n[1] * cr1 - n[2] * sr,
				cr + n[1] * n[1] * cr1,
				n[1] * n[2] * cr1 + n[0] * sr, 0
			]);
			res.push([n[0] * n[2] * cr1 + n[1] * sr,
				n[1] * n[2] * cr1 - n[0] * sr,
				n[2] * n[2] * cr1 + cr, 0
			]);
			res.push([0, 0, 0, 1]);
			return res;
		},
		freerotate: function(center, axis, angle) {
			var itrans = this.translate(-center[0], -center[1], -center[2]);
			var rot = this.rotate(axis, angle);
			var res1 = this.mult(rot, itrans);
			var trans = this.translate(center[0], center[1], center[2]);
			return this.mult(trans, res1);
		},
		transpose: function(matrix) {
			return matrix.map(function(col, i) {
				var res = [];
				for (var j = 0; j < col.length; j++) {
					res[j] = matrix[j][i];
				}
				return res;
			});
		},
		identity: function() {
			return [
				[1, 0, 0, 0],
				[0, 1, 0, 0],
				[0, 0, 1, 0],
				[0, 0, 0, 1]
			];
		},
		translate: function(x, y, z) {
			return [
				[1, 0, 0, 0],
				[0, 1, 0, 0],
				[0, 0, 1, 0],
				[x, y, z, 1]
			];
		},
		scale: function(s) {
			return [
				[s, 0, 0, 0],
				[0, s, 0, 0],
				[0, 0, s, 0],
				[0, 0, 0, 1]
			];
		},
		basis: function(v1,v2,v3) {
			return this.grow([v1,v2,v3],4,4);
		},
		shrink: function(mat, rows, cols) {
			var s = [];
			for (var i = 0; i < rows; i++) {
				s[i] = [];
				for (var j = 0; j < cols; j++) {
					s[i][j] = mat[i][j];
				}
			}
			return s;
		},
		shrink0: function(mat, rows, cols) {
			var s = [];
			for (var i = 0; i < mat.length; i++) {
				s[i] = [];
				for (var j = 0; j < mat[i].length; j++) {
					if (i < cols && j < rows)
						s[i][j] = mat[i][j];
					else
						s[i][j] = 0.0;
				}
			}
			return s;
		},
		grow: function(mat, rows, cols) {
			var s = [];
			var rlen=mat.length;
			var clen=mat[0].length;
			for (var i = 0; i < rows; i++) {
				s[i] = [];
				for (var j = 0; j < cols; j++) {
					if (i < clen && j < rlen)
						s[i][j] = mat[i][j];
					else if(i===j)
						s[i][j] = 1.0;
					else
						s[i][j] = 0.0;
				}
			}
			return s;
		},
		grow0: function(mat, rows, cols) {
			var s = [];
			var rlen=mat.length;
			var clen=mat[0].length;
			for (var i = 0; i < rows; i++) {
				s[i] = [];
				for (var j = 0; j < cols; j++) {
					if (i < clen && j < rlen)
						s[i][j] = mat[i][j];
					else
						s[i][j] = 0.0;
				}
			}
			return s;
		},
		normalmatrix: function(modelview) {
			var s = this.shrink0(modelview, 3, 3);
			s[3][3] = 1; // homogeneous
			return this.shrink(this.transpose(this.inverse(s)), 3, 3);
		},
		/* Deprecated. Use standard projection with upside-down up vector */
		screenproject: function(width, height, near, far) {
			var v = [];
			v[0] = [2 * near / width, 0, 0, 0];
			v[1] = [0, 2 * near / height, 0, 0];
			v[2] = [0, 0, (far + near) / (far - near), 1];
			v[3] = [0, 0, -2 * far * near / (far - near), 0];
			return v;
		},
		project: function(width, height, near, far) {
			var v = [];
			v[0] = [2 * near / width, 0, 0, 0];
			v[1] = [0, 2 * near / height, 0, 0];
			v[2] = [0, 0, (far + near) / (far - near), 1];
			v[3] = [0, 0, -2 * far * near / (far - near), 0];
			return v;
		},
		/* Left-Handed to Celebrate Left-Handed People */
		lookat: function(eye, center, up) {
			var z2 = this.vector.normalize(this.vector.sub(center, eye));
			var x2 = this.vector.normalize(this.vector.cross(up, z2));
			var y2 = this.vector.normalize(this.vector.cross(z2, x2));

			return [
				[x2[0], y2[0], z2[0], 0],
				[x2[1], y2[1], z2[1], 0],
				[x2[2], y2[2], z2[2], 0],
				[-this.vector.dot(x2, eye), -this.vector.dot(y2, eye), -this.vector.dot(z2, eye), 1]
			];
		},
		apply: function(matrix, vector) {
			if (vector[3] === undefined)
				throw ("You need to pass in a homogeneous vector.");

			var vdot = this.vector.pdot(vector);
			var tmat = this.transpose(matrix);
			return [vdot(tmat[0]),
				vdot(tmat[1]),
				vdot(tmat[2]),
				vdot(tmat[3])
			];
		},
		mult: function(m1, m2) {
			return m2.map(function(v, i) {
				return glview.apply(m1, m2[i]);
			});
		},
		// inverse, the not-most-readable way
		inverse: function(m) {
			var r = [
				[],
				[],
				[],
				[]
			];

			r[0][0] = m[1][1] * m[2][2] * m[3][3] - m[1][1] * m[2][3] * m[3][2] - m[2][1] * m[1][2] * m[3][3] + m[2][1] * m[1][3] * m[3][2] + m[3][1] * m[1][2] * m[2][3] - m[3][1] * m[1][3] * m[2][2];
			r[1][0] = -m[1][0] * m[2][2] * m[3][3] + m[1][0] * m[2][3] * m[3][2] + m[2][0] * m[1][2] * m[3][3] - m[2][0] * m[1][3] * m[3][2] - m[3][0] * m[1][2] * m[2][3] + m[3][0] * m[1][3] * m[2][2];
			r[2][0] = m[1][0] * m[2][1] * m[3][3] - m[1][0] * m[2][3] * m[3][1] - m[2][0] * m[1][1] * m[3][3] + m[2][0] * m[1][3] * m[3][1] + m[3][0] * m[1][1] * m[2][3] - m[3][0] * m[1][3] * m[2][1];
			r[3][0] = -m[1][0] * m[2][1] * m[3][2] + m[1][0] * m[2][2] * m[3][1] + m[2][0] * m[1][1] * m[3][2] - m[2][0] * m[1][2] * m[3][1] - m[3][0] * m[1][1] * m[2][2] + m[3][0] * m[1][2] * m[2][1];

			r[0][1] = -m[0][1] * m[2][2] * m[3][3] + m[0][1] * m[2][3] * m[3][2] + m[2][1] * m[0][2] * m[3][3] - m[2][1] * m[0][3] * m[3][2] - m[3][1] * m[0][2] * m[2][3] + m[3][1] * m[0][3] * m[2][2];
			r[1][1] = m[0][0] * m[2][2] * m[3][3] - m[0][0] * m[2][3] * m[3][2] - m[2][0] * m[0][2] * m[3][3] + m[2][0] * m[0][3] * m[3][2] + m[3][0] * m[0][2] * m[2][3] - m[3][0] * m[0][3] * m[2][2];
			r[2][1] = -m[0][0] * m[2][1] * m[3][3] + m[0][0] * m[2][3] * m[3][1] + m[2][0] * m[0][1] * m[3][3] - m[2][0] * m[0][3] * m[3][1] - m[3][0] * m[0][1] * m[2][3] + m[3][0] * m[0][3] * m[2][1];
			r[3][1] = m[0][0] * m[2][1] * m[3][2] - m[0][0] * m[2][2] * m[3][1] - m[2][0] * m[0][1] * m[3][2] + m[2][0] * m[0][2] * m[3][1] + m[3][0] * m[0][1] * m[2][2] - m[3][0] * m[0][2] * m[2][1];

			r[0][2] = m[0][1] * m[1][2] * m[3][3] - m[0][1] * m[1][3] * m[3][2] - m[1][1] * m[0][2] * m[3][3] + m[1][1] * m[0][3] * m[3][2] + m[3][1] * m[0][2] * m[1][3] - m[3][1] * m[0][3] * m[1][2];
			r[1][2] = -m[0][0] * m[1][2] * m[3][3] + m[0][0] * m[1][3] * m[3][2] + m[1][0] * m[0][2] * m[3][3] - m[1][0] * m[0][3] * m[3][2] - m[3][0] * m[0][2] * m[1][3] + m[3][0] * m[0][3] * m[1][2];
			r[2][2] = m[0][0] * m[1][1] * m[3][3] - m[0][0] * m[1][3] * m[3][1] - m[1][0] * m[0][1] * m[3][3] + m[1][0] * m[0][3] * m[3][1] + m[3][0] * m[0][1] * m[1][3] - m[3][0] * m[0][3] * m[1][1];
			r[3][2] = -m[0][0] * m[1][1] * m[3][2] + m[0][0] * m[1][2] * m[3][1] + m[1][0] * m[0][1] * m[3][2] - m[1][0] * m[0][2] * m[3][1] - m[3][0] * m[0][1] * m[1][2] + m[3][0] * m[0][2] * m[1][1];

			r[0][3] = -m[0][1] * m[1][2] * m[2][3] + m[0][1] * m[1][3] * m[2][2] + m[1][1] * m[0][2] * m[2][3] - m[1][1] * m[0][3] * m[2][2] - m[2][1] * m[0][2] * m[1][3] + m[2][1] * m[0][3] * m[1][2];
			r[1][3] = m[0][0] * m[1][2] * m[2][3] - m[0][0] * m[1][3] * m[2][2] - m[1][0] * m[0][2] * m[2][3] + m[1][0] * m[0][3] * m[2][2] + m[2][0] * m[0][2] * m[1][3] - m[2][0] * m[0][3] * m[1][2];
			r[2][3] = -m[0][0] * m[1][1] * m[2][3] + m[0][0] * m[1][3] * m[2][1] + m[1][0] * m[0][1] * m[2][3] - m[1][0] * m[0][3] * m[2][1] - m[2][0] * m[0][1] * m[1][3] + m[2][0] * m[0][3] * m[1][1];
			r[3][3] = m[0][0] * m[1][1] * m[2][2] - m[0][0] * m[1][2] * m[2][1] - m[1][0] * m[0][1] * m[2][2] + m[1][0] * m[0][2] * m[2][1] + m[2][0] * m[0][1] * m[1][2] - m[2][0] * m[0][2] * m[1][1];

			var det = m[0][0] * r[0][0] + m[1][0] * r[0][1] + m[2][0] * r[0][2] + m[3][0] * r[0][3];
			for (var c = 0; c < 4; c++) {
				for (var i = 0; i < 4; i++) {
					r[c][i] /= det;
				}
			}
			return r;
		}

	};

	namespace.add("glview",glview);

})(__);
