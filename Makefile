.PHONY: run bench bench-gpu deploy
run:        ## local demo (synthetic brain) at :8080
	uvicorn api.main:app --reload --port 8080
bench:      ## cuDF benchmark — CPU baseline
	python accel/cudf_benchmark.py
bench-gpu:  ## cuDF benchmark — NVIDIA GPU (zero code change)
	python -m cudf.pandas accel/cudf_benchmark.py
deploy:     ## build + deploy to Cloud Run
	gcloud builds submit --config deploy/cloudbuild.yaml --substitutions=_REGION=us-central1
