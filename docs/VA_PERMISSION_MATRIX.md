# VA Permission Matrix

| Action | VA | Owner | Automated system |
|---|---:|---:|---:|
| View source health | Yes | Yes | — |
| Rerun allowlisted ingestion | Yes | Yes | Yes |
| Retry failed export | Yes | Yes | Yes |
| View correction evidence | Yes | Yes | — |
| Approve high-risk correction | No | Yes | No |
| Change methodology | No | Through reviewed PR | No |
| Change model variables | No | Through reviewed PR | No |
| Change secrets | No | Yes | No |
| Emergency stop | Only if explicitly authorized | Yes | No |
| Resume after emergency stop | No by default | Yes | No |
| Override failed city gates | No | No direct override | No |

